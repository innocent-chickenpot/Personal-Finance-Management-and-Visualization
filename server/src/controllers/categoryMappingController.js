function getPrisma(req) {
  return req.app.get('prisma')
}

async function list(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { source } = req.query
    const where = { userId: req.userId }
    if (source) where.source = source

    const mappings = await prisma.categoryMapping.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } }
      },
      orderBy: [{ source: 'asc' }, { sourceName: 'asc' }]
    })

    res.json({ code: 200, data: mappings })
  } catch (err) {
    next(err)
  }
}

async function save(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { mappings } = req.body

    if (!Array.isArray(mappings)) {
      return res.status(400).json({ code: 400, message: '请提供映射规则数组' })
    }

    // Delete existing mappings for the sources being updated
    const sources = [...new Set(mappings.map(m => m.source))]
    for (const source of sources) {
      await prisma.categoryMapping.deleteMany({
        where: { userId: req.userId, source }
      })
    }

    // Insert new mappings
    const created = []
    for (const m of mappings) {
      const record = await prisma.categoryMapping.create({
        data: {
          userId: req.userId,
          source: m.source,
          sourceName: m.sourceName,
          categoryId: Number(m.categoryId)
        },
        include: {
          category: { select: { id: true, name: true } }
        }
      })
      created.push(record)
    }

    res.json({ code: 200, data: created })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, save }

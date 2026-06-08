function getPrisma(req) {
  return req.app.get('prisma')
}

async function list(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { type } = req.query
    const where = {
      OR: [
        { isPreset: true },
        { userId: req.userId }
      ]
    }
    if (type) where.type = type

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ isPreset: 'desc' }, { id: 'asc' }]
    })
    res.json({ code: 200, data: categories })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { name, type } = req.body
    if (!name || !type) {
      return res.status(400).json({ code: 400, message: '名称和类型不能为空' })
    }

    const existing = await prisma.category.findFirst({
      where: { name, type, OR: [{ isPreset: true }, { userId: req.userId }] }
    })
    if (existing) {
      return res.status(400).json({ code: 400, message: '该分类已存在' })
    }

    const category = await prisma.category.create({
      data: { name, type, userId: req.userId }
    })
    res.json({ code: 200, data: category })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const id = Number(req.params.id)

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing || existing.userId !== req.userId || existing.isPreset) {
      return res.status(403).json({ code: 403, message: '不能修改此分类' })
    }

    const { name } = req.body
    const category = await prisma.category.update({
      where: { id },
      data: { name }
    })
    res.json({ code: 200, data: category })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const id = Number(req.params.id)

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing || existing.userId !== req.userId || existing.isPreset) {
      return res.status(403).json({ code: 403, message: '不能删除此分类' })
    }

    const used = await prisma.transaction.findFirst({ where: { categoryId: id } })
    if (used) {
      return res.status(400).json({ code: 400, message: '该分类已被使用，无法删除' })
    }

    await prisma.category.delete({ where: { id } })
    res.json({ code: 200, data: null, message: '删除成功' })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove }

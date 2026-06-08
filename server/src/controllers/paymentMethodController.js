function getPrisma(req) {
  return req.app.get('prisma')
}

async function list(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const methods = await prisma.paymentMethod.findMany({
      where: {
        OR: [
          { isPreset: true },
          { userId: req.userId }
        ]
      },
      orderBy: [{ isPreset: 'desc' }, { id: 'asc' }]
    })
    res.json({ code: 200, data: methods })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { name, balance } = req.body
    if (!name) {
      return res.status(400).json({ code: 400, message: '名称不能为空' })
    }

    const existing = await prisma.paymentMethod.findFirst({
      where: { name, OR: [{ isPreset: true }, { userId: req.userId }] }
    })
    if (existing) {
      return res.status(400).json({ code: 400, message: '该渠道已存在' })
    }

    const method = await prisma.paymentMethod.create({
      data: { name, userId: req.userId, balance: balance || 0 }
    })
    res.json({ code: 200, data: method })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const id = Number(req.params.id)

    const existing = await prisma.paymentMethod.findUnique({ where: { id } })
    if (!existing || existing.userId !== req.userId) {
      return res.status(403).json({ code: 403, message: '不能修改此渠道' })
    }

    const { name, balance } = req.body
    const data = {}
    if (name) data.name = name
    if (balance !== undefined) data.balance = Number(balance)

    const method = await prisma.paymentMethod.update({ where: { id }, data })
    res.json({ code: 200, data: method })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const id = Number(req.params.id)

    const existing = await prisma.paymentMethod.findUnique({ where: { id } })
    if (!existing || existing.userId !== req.userId || existing.isPreset) {
      return res.status(403).json({ code: 403, message: '不能删除此渠道' })
    }

    const used = await prisma.transaction.findFirst({ where: { paymentMethodId: id } })
    if (used) {
      return res.status(400).json({ code: 400, message: '该渠道已被使用，无法删除' })
    }

    await prisma.paymentMethod.delete({ where: { id } })
    res.json({ code: 200, data: null, message: '删除成功' })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove }

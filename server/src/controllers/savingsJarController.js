function getPrisma(req) {
  return req.app.get('prisma')
}

async function list(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const jars = await prisma.savingsJar.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' }
    })
    res.json({ code: 200, data: jars })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { name, targetAmount } = req.body
    if (!name || !targetAmount) {
      return res.status(400).json({ code: 400, message: '请填写名称和目标金额' })
    }
    const jar = await prisma.savingsJar.create({
      data: {
        userId: req.userId,
        name,
        targetAmount: Number(targetAmount),
        savedAmount: 0
      }
    })
    res.json({ code: 200, data: jar })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { id } = req.params
    const jar = await prisma.savingsJar.findFirst({
      where: { id: Number(id), userId: req.userId }
    })
    if (!jar) {
      return res.status(404).json({ code: 404, message: '储蓄罐不存在' })
    }
    const { name, targetAmount } = req.body
    const updated = await prisma.savingsJar.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(targetAmount && { targetAmount: Number(targetAmount) })
      }
    })
    res.json({ code: 200, data: updated })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { id } = req.params
    const jar = await prisma.savingsJar.findFirst({
      where: { id: Number(id), userId: req.userId }
    })
    if (!jar) {
      return res.status(404).json({ code: 404, message: '储蓄罐不存在' })
    }
    await prisma.savingsJar.delete({ where: { id: Number(id) } })
    res.json({ code: 200, message: '已删除' })
  } catch (err) {
    next(err)
  }
}

async function deposit(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { id } = req.params
    const { amount } = req.body

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ code: 400, message: '请输入有效的金额' })
    }

    const jar = await prisma.savingsJar.findFirst({
      where: { id: Number(id), userId: req.userId }
    })
    if (!jar) {
      return res.status(404).json({ code: 404, message: '储蓄罐不存在' })
    }

    let savingsCategory = await prisma.category.findFirst({
      where: { name: '转账至储蓄罐', type: 'expense', userId: null }
    })
    if (!savingsCategory) {
      savingsCategory = await prisma.category.create({
        data: { name: '转账至储蓄罐', type: 'expense', isPreset: true }
      })
    }

    const defaultPayment = await prisma.paymentMethod.findFirst({
      where: { userId: req.userId }
    })

    await prisma.$transaction([
      prisma.savingsJar.update({
        where: { id: Number(id) },
        data: { savedAmount: { increment: Number(amount) } }
      }),
      prisma.transaction.create({
        data: {
          userId: req.userId,
          type: 'expense',
          amount: Number(amount),
          categoryId: savingsCategory.id,
          paymentMethodId: defaultPayment?.id || 1,
          transactionDate: new Date(),
          note: `转账至储蓄罐 - ${jar.name}`
        }
      })
    ])

    const updated = await prisma.savingsJar.findUnique({
      where: { id: Number(id) }
    })

    res.json({ code: 200, data: updated })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove, deposit }

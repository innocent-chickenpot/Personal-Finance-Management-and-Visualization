function getPrisma(req) {
  return req.app.get('prisma')
}

async function list(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const budgets = await prisma.budget.findMany({
      where: { userId: req.userId }
    })

    // Get current month's spend per budget category
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const result = await Promise.all(budgets.map(async (b) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          userId: req.userId,
          categoryId: b.categoryId,
          type: 'expense',
          transactionDate: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { amount: true }
      })

      const category = await prisma.category.findUnique({
        where: { id: b.categoryId },
        select: { id: true, name: true }
      })

      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: category?.name || '未知',
        budgetAmount: Number(b.amount),
        spentAmount: Number(spent._sum.amount || 0),
        remaining: Number(b.amount) - Number(spent._sum.amount || 0),
        percent: Math.min(100, Math.round((Number(spent._sum.amount || 0) / Number(b.amount)) * 100))
      }
    }))

    res.json({ code: 200, data: result })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { categoryId, amount, period } = req.body
    if (!categoryId || !amount) {
      return res.status(400).json({ code: 400, message: '请选择分类和预算金额' })
    }
    const budget = await prisma.budget.create({
      data: {
        userId: req.userId,
        categoryId: Number(categoryId),
        amount: Number(amount),
        period: period || 'monthly'
      }
    })
    res.json({ code: 200, data: budget })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { id } = req.params
    const { amount } = req.body
    const budget = await prisma.budget.update({
      where: { id: Number(id) },
      data: { amount: Number(amount) }
    })
    res.json({ code: 200, data: budget })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const prisma = getPrisma(req)
    await prisma.budget.delete({ where: { id: Number(req.params.id) } })
    res.json({ code: 200, message: '已删除' })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove }

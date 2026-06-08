function getPrisma(req) {
  return req.app.get('prisma')
}

async function summary(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { start_date, end_date } = req.query
    const dateFilter = {}
    if (start_date) dateFilter.gte = new Date(start_date + 'T00:00:00')
    if (end_date) dateFilter.lte = new Date(end_date + 'T23:59:59.999')
    const where = { userId: req.userId }
    if (Object.keys(dateFilter).length > 0) {
      where.transactionDate = dateFilter
    }

    const results = await prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true }
    })

    const income = results.find(r => r.type === 'income')?._sum.amount || 0
    const expense = results.find(r => r.type === 'expense')?._sum.amount || 0
    const balance = Number(income) - Number(expense)

    res.json({
      code: 200,
      data: {
        totalIncome: Number(income),
        totalExpense: Number(expense),
        balance
      }
    })
  } catch (err) {
    next(err)
  }
}

async function byCategory(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { start_date, end_date, type = 'expense' } = req.query
    const dateFilter = {}
    if (start_date) dateFilter.gte = new Date(start_date + 'T00:00:00')
    if (end_date) dateFilter.lte = new Date(end_date + 'T23:59:59.999')
    const where = { userId: req.userId, type }
    if (Object.keys(dateFilter).length > 0) {
      where.transactionDate = dateFilter
    }

    const results = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true }
    })

    const categoryIds = results.map(r => r.categoryId)
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true }
    })
    const categoryMap = {}
    categories.forEach(c => { categoryMap[c.id] = c.name })

    const data = results.map(r => ({
      name: categoryMap[r.categoryId] || '未知',
      value: Number(r._sum.amount)
    }))

    res.json({ code: 200, data })
  } catch (err) {
    next(err)
  }
}

async function monthlyTrend(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const year = parseInt(req.query.year) || new Date().getFullYear()

    const start = new Date(`${year}-01-01`)
    const end = new Date(`${year + 1}-01-01`)

    const all = await prisma.transaction.findMany({
      where: {
        userId: req.userId,
        transactionDate: { gte: start, lt: end }
      },
      select: { type: true, amount: true, transactionDate: true }
    })

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0
    }))

    all.forEach(t => {
      const m = new Date(t.transactionDate).getMonth()
      const amt = Number(t.amount)
      if (t.type === 'income') {
        months[m].income += amt
      } else {
        months[m].expense += amt
      }
    })

    res.json({ code: 200, data: months })
  } catch (err) {
    next(err)
  }
}

module.exports = { summary, byCategory, monthlyTrend }

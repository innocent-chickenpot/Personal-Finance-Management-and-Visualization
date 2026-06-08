function getPrisma(req) {
  return req.app.get('prisma')
}

async function list(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const {
      type, category_id, payment_method_id,
      start_date, end_date,
      page = '1', pageSize = '20'
    } = req.query

    const where = { userId: req.userId }
    if (type) where.type = type
    if (category_id) where.categoryId = Number(category_id)
    if (payment_method_id) where.paymentMethodId = Number(payment_method_id)
    if (start_date || end_date) {
      where.transactionDate = {}
      if (start_date) where.transactionDate.gte = new Date(start_date + 'T00:00:00')
      if (end_date) where.transactionDate.lte = new Date(end_date + 'T23:59:59.999')
    }

    const skip = (Number(page) - 1) * Number(pageSize)
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, type: true } },
          paymentMethod: { select: { id: true, name: true } }
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: Number(pageSize)
      }),
      prisma.transaction.count({ where })
    ])

    res.json({
      code: 200,
      data: {
        items,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const { type, amount, category_id, payment_method_id, note, transaction_date } = req.body

    if (!type || !amount || !category_id || !payment_method_id || !transaction_date) {
      return res.status(400).json({ code: 400, message: '请填写必填字段' })
    }
    if (amount <= 0) {
      return res.status(400).json({ code: 400, message: '金额必须大于0' })
    }

    const record = await prisma.transaction.create({
      data: {
        userId: req.userId,
        type,
        amount: Number(amount),
        categoryId: Number(category_id),
        paymentMethodId: Number(payment_method_id),
        note: note || null,
        transactionDate: new Date(transaction_date + 'T00:00:00')
      },
      include: {
        category: { select: { id: true, name: true, type: true } },
        paymentMethod: { select: { id: true, name: true } }
      }
    })

    res.json({ code: 200, data: record })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const id = Number(req.params.id)

    const existing = await prisma.transaction.findUnique({ where: { id } })
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ code: 404, message: '记录不存在' })
    }

    const { type, amount, category_id, payment_method_id, note, transaction_date } = req.body
    const data = {}
    if (type) data.type = type
    if (amount !== undefined) {
      if (amount <= 0) return res.status(400).json({ code: 400, message: '金额必须大于0' })
      data.amount = Number(amount)
    }
    if (category_id) data.categoryId = Number(category_id)
    if (payment_method_id) data.paymentMethodId = Number(payment_method_id)
    if (note !== undefined) data.note = note
    if (transaction_date) data.transactionDate = new Date(transaction_date + 'T00:00:00')

    const record = await prisma.transaction.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, type: true } },
        paymentMethod: { select: { id: true, name: true } }
      }
    })

    res.json({ code: 200, data: record })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const prisma = getPrisma(req)
    const id = Number(req.params.id)

    const existing = await prisma.transaction.findUnique({ where: { id } })
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ code: 404, message: '记录不存在' })
    }

    await prisma.transaction.delete({ where: { id } })
    res.json({ code: 200, data: null, message: '删除成功' })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove }

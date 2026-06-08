require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { PrismaClient } = require('@prisma/client')
const authRoutes = require('./routes/auth')
const transactionRoutes = require('./routes/transactions')
const categoryRoutes = require('./routes/categories')
const paymentMethodRoutes = require('./routes/paymentMethods')
const statsRoutes = require('./routes/stats')
const savingsJarRoutes = require('./routes/savingsJars')
const budgetRoutes = require('./routes/budgets')
const categoryMappingRoutes = require('./routes/categoryMappings')
const errorHandler = require('./middleware/errorHandler')

const prisma = new PrismaClient({})
const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.set('prisma', prisma)

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/payment-methods', paymentMethodRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/savings-jars', savingsJarRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/category-mappings', categoryMappingRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

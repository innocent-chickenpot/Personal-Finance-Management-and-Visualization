const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({})

const expenseCategories = [
  '餐饮', '购物', '交通', '娱乐', '医疗', '住房', '教育', '转账至储蓄罐', '其他'
]
const incomeCategories = [
  '工资', '奖金', '兼职', '投资', '转账', '其他'
]
const paymentMethods = [
  '银行卡', '微信', '支付宝', '现金', '其他'
]

async function main() {
  console.log('开始写入预设数据...')

  // 写入支出分类（跳过已存在的）
  for (const name of expenseCategories) {
    const exist = await prisma.category.findFirst({
      where: { name, type: 'expense', isPreset: true }
    })
    if (!exist) {
      await prisma.category.create({
        data: { name, type: 'expense', isPreset: true }
      })
    }
  }
  console.log(`支出分类已就绪 (${expenseCategories.length} 项)`)

  // 写入收入分类
  for (const name of incomeCategories) {
    const exist = await prisma.category.findFirst({
      where: { name, type: 'income', isPreset: true }
    })
    if (!exist) {
      await prisma.category.create({
        data: { name, type: 'income', isPreset: true }
      })
    }
  }
  console.log(`收入分类已就绪 (${incomeCategories.length} 项)`)

  // 写入支付渠道
  for (const name of paymentMethods) {
    const exist = await prisma.paymentMethod.findFirst({
      where: { name, isPreset: true }
    })
    if (!exist) {
      await prisma.paymentMethod.create({
        data: { name, isPreset: true, balance: 0 }
      })
    }
  }
  console.log(`支付渠道已就绪 (${paymentMethods.length} 项)`)

  console.log('预设数据写入完成!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

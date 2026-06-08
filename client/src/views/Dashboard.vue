<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getSummary, getByCategory, getMonthlyTrend } from '@/api/stats'
import { getTransactions } from '@/api/transactions'
import { getSavingsJars } from '@/api/savingsJars'
import { getBudgets } from '@/api/budgets'
import * as echarts from 'echarts'
import DogMascot from '@/components/DogMascot.vue'
import SavingsJar from '@/components/SavingsJar.vue'

const router = useRouter()
const auth = useAuthStore()

// ── Greeting ──
const now = new Date()
const hour = now.getHours()
const greeting = computed(() => {
  if (hour < 6) return { emoji: '🌙', text: '夜深了' }
  if (hour < 9) return { emoji: '🌅', text: '早上好' }
  if (hour < 12) return { emoji: '☀️', text: '上午好' }
  if (hour < 14) return { emoji: '🌞', text: '中午好' }
  if (hour < 18) return { emoji: '🌤️', text: '下午好' }
  if (hour < 23) return { emoji: '🌆', text: '晚上好' }
  return { emoji: '🌙', text: '夜深了' }
})
const nickname = computed(() => (auth.user?.email || '').split('@')[0])
const daysSince = computed(() => {
  if (!auth.user?.createdAt) return 0
  const created = new Date(auth.user.createdAt)
  const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff)
})
const dateStr = computed(() => {
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日  星期${['日','一','二','三','四','五','六'][now.getDay()]}`
})

// ── Monthly metrics ──
const totalIncome = ref(0)
const totalExpense = ref(0)
const balance = ref(0)
const savingsRate = ref(0)

// ── Month-over-month changes ──
const momChanges = computed(() => {
  const m = now.getMonth()
  const prev = m === 0 ? 11 : m - 1
  const curr = trendData.value[m] || { income: 0, expense: 0 }
  const last = trendData.value[prev] || { income: 0, expense: 0 }

  const incomeChange = last.income > 0 ? ((curr.income - last.income) / last.income * 100) : (curr.income > 0 ? 100 : 0)
  const expenseChange = last.expense > 0 ? ((curr.expense - last.expense) / last.expense * 100) : (curr.expense > 0 ? 100 : 0)
  const currBalance = curr.income - curr.expense
  const lastBalance = last.income - last.expense
  const balanceChange = lastBalance !== 0 ? ((currBalance - lastBalance) / Math.abs(lastBalance) * 100) : (currBalance !== 0 ? 100 : 0)
  const currSavings = curr.income > 0 ? (currBalance / curr.income * 100) : 0
  const lastSavings = last.income > 0 ? (lastBalance / last.income * 100) : 0
  const savingsChange = lastSavings !== 0 ? (currSavings - lastSavings) : 0

  return {
    income: incomeChange,
    expense: expenseChange,
    balance: balanceChange,
    savings: savingsChange
  }
})

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const monthStart = computed(() => {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
})
const monthEnd = computed(() => {
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

// ── Trend chart ──
const trendRef = ref(null)
let trendChart = null
const trendData = ref([])
const trendPeriod = ref(6) // 6 or 12 months

const trendMonths = computed(() => {
  const count = trendPeriod.value
  if (trendData.value.length === 0) return []
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  // Show last N months relative to current month
  const currentMonth = now.getMonth()
  const result = []
  for (let i = count - 1; i >= 0; i--) {
    const idx = (currentMonth - i + 12) % 12
    result.push({ label: months[idx], data: trendData.value[idx] || { income: 0, expense: 0 } })
  }
  return result
})

// ── Category pie ──
const pieRef = ref(null)
let pieChart = null
const pieData = ref([])
const DONUT_COLORS = ['#F8A8A8','#A8D8A8','#F8C878','#C8A8E8','#B8D898','#98C8E8','#E8D0B0']
const totalExpenseForPie = computed(() => {
  if (!pieData.value || pieData.value.length === 0) return 0
  return pieData.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
})

// ── Savings goal (from first jar or defaults) ──
const savingsGoal = computed(() => {
  if (jars.value.length > 0) {
    const jar = jars.value[0]
    return {
      name: jar.name,
      current: Number(jar.savedAmount || 0),
      target: Number(jar.targetAmount || 1),
      percent: jar.targetAmount > 0 ? Math.round((Number(jar.savedAmount || 0) / Number(jar.targetAmount)) * 1000) / 10 : 0,
      expectedDate: ''
    }
  }
  return {
    name: '储蓄目标',
    current: 0,
    target: 1,
    percent: 0,
    expectedDate: ''
  }
})

// ── Savings jars ──
const jars = ref([])
const showNewJar = ref(false)
const newJarForm = ref({ name: '', targetAmount: '' })
const creatingJar = ref(false)

// ── Recent transactions ──
const recentItems = ref([])

// ── Budgets ──
const budgets = ref([])

// ── Loading ──
const loading = ref(true)

// ── Init ──
onMounted(async () => {
  try {
    const year = now.getFullYear()
    const results = await Promise.allSettled([
      getSummary({ start_date: monthStart.value, end_date: monthEnd.value }),
      getByCategory({ start_date: monthStart.value, end_date: monthEnd.value }),
      getMonthlyTrend({ year }),
      getSavingsJars(),
      getTransactions({ page: 1, pageSize: 6 }),
      getBudgets()
    ])

    const [summaryRes, catRes, trendRes, jarsRes, txRes, budgetRes] = results.map(r =>
      r.status === 'fulfilled' ? r.value : { code: -1, data: null }
    )

    if (summaryRes.code === 200) {
      totalIncome.value = summaryRes.data.totalIncome
      totalExpense.value = summaryRes.data.totalExpense
      balance.value = summaryRes.data.balance
      savingsRate.value = totalIncome.value > 0 ? Math.round((balance.value / totalIncome.value) * 1000) / 10 : 0
    }
    if (catRes.code === 200) pieData.value = catRes.data
    if (trendRes.code === 200) trendData.value = trendRes.data
    if (jarsRes.code === 200) jars.value = jarsRes.data
    if (txRes.code === 200) recentItems.value = txRes.data.items.slice(0, 6)
    if (budgetRes.code === 200) budgets.value = budgetRes.data

    await nextTick()
    renderTrendChart()
    renderPieChart()
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  trendChart?.dispose()
  pieChart?.dispose()
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
}

// ── Trend Chart: dual bar with watercolor style ──
function renderTrendChart() {
  if (!trendRef.value) return
  trendChart?.dispose()
  trendChart = echarts.init(trendRef.value)

  const months = trendMonths.value
  const incomes = months.map(m => m.data.income)
  const expenses = months.map(m => m.data.expense)
  const labels = months.map(m => m.label)

  // Find max value for bubble positioning (last month)
  const lastIncome = incomes[incomes.length - 1] || 0
  const lastExpense = expenses[expenses.length - 1] || 0

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFDF9',
      borderColor: '#F0EAE2',
      textStyle: { color: '#5D4E37', fontSize: 13 },
      formatter: params => {
        let s = params[0].axisValue + '<br/>'
        params.forEach(p => { s += `${p.marker} ${p.seriesName}: ¥${p.value.toLocaleString()}<br/>` })
        return s
      }
    },
    legend: {
      data: ['收入', '支出'],
      left: 8,
      top: 0,
      textStyle: { color: '#A89880', fontSize: 12 },
      itemWidth: 10, itemHeight: 10, itemGap: 20
    },
    grid: { left: 16, right: 16, top: 36, bottom: 8 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#F0EAE2' } },
      axisTick: { show: false },
      axisLabel: { color: '#A89880', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#F0EAE2', type: 'dashed' } },
      axisLabel: {
        color: '#A89880', fontSize: 10,
        formatter: v => v >= 1000 ? (v / 1000) + 'k' : v
      }
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        barWidth: 18,
        barGap: '30%',
        itemStyle: {
          color: '#F8A8A8',
          borderRadius: [6, 6, 0, 0],
          opacity: 0.85
        },
        emphasis: { itemStyle: { opacity: 1 } },
        data: incomes,
        markPoint: {
          data: [
            {
              name: '收入',
              coord: [labels.length - 1, lastIncome],
              value: lastIncome,
              symbol: 'rect',
              symbolSize: [70, 26],
              symbolOffset: [0, -18],
              itemStyle: { color: '#FFF0F0', borderColor: '#F8C8C8', borderWidth: 1, borderRadius: 6 },
              label: {
                formatter: c => `¥${c.value.toLocaleString()}`,
                color: '#C08080',
                fontSize: 11,
                fontWeight: 600
              }
            }
          ],
          symbolKeepAspect: true
        }
      },
      {
        name: '支出',
        type: 'bar',
        barWidth: 18,
        itemStyle: {
          color: '#A8D8A8',
          borderRadius: [6, 6, 0, 0],
          opacity: 0.85
        },
        emphasis: { itemStyle: { opacity: 1 } },
        data: expenses,
        markPoint: {
          data: [
            {
              name: '支出',
              coord: [labels.length - 1, lastExpense],
              value: lastExpense,
              symbol: 'rect',
              symbolSize: [70, 26],
              symbolOffset: [0, -18],
              itemStyle: { color: '#F0FFF0', borderColor: '#B8D8B8', borderWidth: 1, borderRadius: 6 },
              label: {
                formatter: c => `¥${c.value.toLocaleString()}`,
                color: '#6A8F5E',
                fontSize: 11,
                fontWeight: 600
              }
            }
          ],
          symbolKeepAspect: true
        }
      }
    ]
  })

  window.addEventListener('resize', handleResize)
}

// ── Donut Chart: ring with smiley center ──
function renderPieChart() {
  if (!pieRef.value) return
  pieChart?.dispose()
  pieChart = echarts.init(pieRef.value)

  const data = pieData.value.map((item, i) => ({
    ...item,
    itemStyle: { color: DONUT_COLORS[i % DONUT_COLORS.length] }
  }))

  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: '#FFFDF9',
      borderColor: '#F0EAE2',
      textStyle: { color: '#5D4E37', fontSize: 13 }
    },
    series: [{
      type: 'pie',
      radius: ['52%', '75%'],
      center: ['50%', '50%'],
      itemStyle: { borderRadius: 3, borderColor: '#FFFDF9', borderWidth: 2 },
      label: {
        show: true,
        position: 'outside',
        formatter: '{d}%',
        color: '#8B6B52',
        fontSize: 11,
        fontWeight: 600
      },
      emphasis: { scaleSize: 6 },
      data
    }],
    graphic: [
      // Smiley face in center of donut
      {
        type: 'group',
        left: 'center',
        top: 'center',
        bounding: 'raw',
        children: [
          // Left eye
          { type: 'circle', shape: { cx: -8, cy: -4, r: 3.5 }, style: { fill: '#5D4E37' }, z: 10 },
          // Right eye
          { type: 'circle', shape: { cx: 8, cy: -4, r: 3.5 }, style: { fill: '#5D4E37' }, z: 10 },
          // Blush left
          { type: 'circle', shape: { cx: -14, cy: 0, r: 5 }, style: { fill: '#FCC8C8', opacity: 0.5 }, z: 9 },
          // Blush right
          { type: 'circle', shape: { cx: 14, cy: 0, r: 5 }, style: { fill: '#FCC8C8', opacity: 0.5 }, z: 9 },
          // Smile arc
          {
            type: 'arc',
            shape: { cx: 0, cy: 4, r: 10, startAngle: 0.2, endAngle: Math.PI - 0.2 },
            style: { stroke: '#5D4E37', lineWidth: 2, fill: 'transparent' },
            z: 10
          }
        ]
      }
    ]
  })
}

// ── Period toggle ──
function togglePeriod() {
  trendPeriod.value = trendPeriod.value === 6 ? 12 : 6
}

// Watch for chart data changes
watch(trendMonths, () => {
  nextTick(() => renderTrendChart())
})

watch(pieData, () => {
  nextTick(() => renderPieChart())
})

// ── Savings Jars ──
async function createJar() {
  if (!newJarForm.value.name || !newJarForm.value.targetAmount) return
  creatingJar.value = true
  try {
    const { createSavingsJar } = await import('@/api/savingsJars')
    const res = await createSavingsJar({
      name: newJarForm.value.name,
      targetAmount: Number(newJarForm.value.targetAmount)
    })
    if (res.code === 200) {
      jars.value.push(res.data)
      showNewJar.value = false
      newJarForm.value = { name: '', targetAmount: '' }
    }
  } catch {} finally {
    creatingJar.value = false
  }
}

function onJarUpdated(updatedJar) {
  const idx = jars.value.findIndex(j => j.id === updatedJar.id)
  if (idx >= 0) jars.value[idx] = updatedJar
}

function onJarDeleted(id) {
  jars.value = jars.value.filter(j => j.id !== id)
}

// ── Budget progress ──
function budgetProgressClass(pct) {
  if (pct > 100) return 'exceeded'
  if (pct > 80) return 'warning'
  return 'safe'
}

// ── Route ──
function goTx() { router.push('/transactions') }
function goNewTx() { router.push('/transactions/new') }
</script>

<template>
  <div class="dashboard">
    <!-- ═══ Loading ═══ -->
    <div v-if="loading" class="loading-state">
      <DogMascot :size="120" pose="lying" />
      <p>正在整理你的账本...</p>
    </div>

    <template v-else>
      <!-- ═══ 1. Greeting Header ═══ -->
      <div class="greeting-row">
        <div class="greeting-left">
          <h1 class="greeting-title">
            <span class="greeting-emoji">{{ greeting.emoji }}</span>
            {{ greeting.text }}，{{ nickname }}
          </h1>
          <p class="greeting-days">
            今天是好好管理财务的第 <span class="days-count">{{ daysSince }}</span> 天
          </p>
        </div>
        <div class="greeting-right">
          <p class="greeting-date">{{ dateStr }}</p>
        </div>
      </div>

      <!-- ═══ 2. Monthly Metrics ═══ -->
      <div class="summary-stickers">
        <!-- Card 1: 本月收入 -->
        <div class="finance-card card-income">
          <div class="card-body">
            <div class="card-header">
              <span class="card-label">本月收入</span>
              <svg class="card-help" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#C8C0B8" stroke-width="1.2"/><path d="M6.2 6.2c.3-.6.9-1 1.7-1 .8 0 1.5.3 1.5 1.2 0 1.2-2 1.5-2 2.8" stroke="#C8C0B8" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.7" fill="#C8C0B8"/></svg>
            </div>
            <div class="card-value">¥{{ formatCurrency(totalIncome) }}</div>
            <div class="card-change" :class="momChanges.income >= 0 ? 'up' : 'down'">
              {{ Math.abs(momChanges.income) < 0.05 ? '较上月 持平' : `较上月 ${momChanges.income >= 0 ? '↑' : '↓'} ${Math.abs(momChanges.income).toFixed(1)}%` }}
            </div>
          </div>
          <div class="card-icon-wrap">
            <svg class="card-icon" width="64" height="52" viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="14" width="52" height="34" rx="8" fill="#FCC8C8" stroke="#E8A0A0" stroke-width="1.5"/>
              <rect x="6" y="14" width="52" height="34" rx="8" stroke="#F0C0C0" stroke-width="0.8" stroke-dasharray="3 3"/>
              <rect x="20" y="8" width="24" height="12" rx="4" fill="#FCC8C8" stroke="#E8A0A0" stroke-width="1.5"/>
              <circle cx="32" cy="14" r="4" fill="#F8E8A8" stroke="#E8C860" stroke-width="1.2"/>
              <rect x="14" y="22" width="16" height="10" rx="3" fill="#FFF8F8" stroke="#F0C0C0" stroke-width="0.8"/>
              <rect x="14" y="36" width="12" height="1.5" rx="0.8" fill="#F0C0C0"/>
              <rect x="14" y="40" width="8" height="1.5" rx="0.8" fill="#F0C0C0"/>
            </svg>
          </div>
          <div class="card-decoration star">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 2l2.5 9.5H26l-7 5.5 2.5 9L14 20.5l-7.5 5.5L9 16.5l-7-5.5h9.5L14 2z" fill="#F8E8A8" stroke="#E8C860" stroke-width="1.2" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- Card 2: 本月支出 -->
        <div class="finance-card card-expense">
          <div class="card-body">
            <div class="card-header">
              <span class="card-label">本月支出</span>
              <svg class="card-help" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#C8C0B8" stroke-width="1.2"/><path d="M6.2 6.2c.3-.6.9-1 1.7-1 .8 0 1.5.3 1.5 1.2 0 1.2-2 1.5-2 2.8" stroke="#C8C0B8" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.7" fill="#C8C0B8"/></svg>
            </div>
            <div class="card-value">¥{{ formatCurrency(totalExpense) }}</div>
            <div class="card-change expense-change" :class="momChanges.expense <= 0 ? 'good' : 'bad'">
              {{ Math.abs(momChanges.expense) < 0.05 ? '较上月 持平' : `较上月 ${momChanges.expense >= 0 ? '↑' : '↓'} ${Math.abs(momChanges.expense).toFixed(1)}%` }}
            </div>
          </div>
          <div class="card-icon-wrap">
            <svg class="card-icon" width="56" height="58" viewBox="0 0 56 58" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="16" width="40" height="36" rx="6" fill="#C8E8C8" stroke="#A0D0A0" stroke-width="1.5"/>
              <path d="M16 16V12c0-3 3-5 5-5h14c2 0 5 2 5 5v4" stroke="#A0D0A0" stroke-width="2" stroke-linecap="round"/>
              <circle cx="34" cy="6" r="3" fill="#FFF" stroke="#D0E8D0" stroke-width="0.8"/>
              <circle cx="36" cy="4.5" r="1" fill="#FFF8C0"/>
              <circle cx="38" cy="5" r="0.6" fill="#FFF8C0"/>
              <circle cx="33" cy="4" r="0.6" fill="#FFF8C0"/>
              <circle cx="35" cy="6" r="0.5" fill="#FFF8C0"/>
            </svg>
          </div>
        </div>

        <!-- Card 3: 结余 -->
        <div class="finance-card card-balance">
          <div class="card-body">
            <div class="card-header">
              <span class="card-label">结余</span>
              <svg class="card-help" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#C8C0B8" stroke-width="1.2"/><path d="M6.2 6.2c.3-.6.9-1 1.7-1 .8 0 1.5.3 1.5 1.2 0 1.2-2 1.5-2 2.8" stroke="#C8C0B8" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.7" fill="#C8C0B8"/></svg>
            </div>
            <div class="card-value">¥{{ formatCurrency(balance) }}</div>
            <div class="card-change" :class="momChanges.balance >= 0 ? 'up' : 'down'">
              {{ Math.abs(momChanges.balance) < 0.05 ? '较上月 持平' : `较上月 ${momChanges.balance >= 0 ? '↑' : '↓'} ${Math.abs(momChanges.balance).toFixed(1)}%` }}
            </div>
          </div>
          <div class="card-icon-wrap">
            <svg class="card-icon" width="58" height="54" viewBox="0 0 58 54" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="29" cy="30" rx="22" ry="20" fill="#FCC8C8" stroke="#E8A0A0" stroke-width="1.5"/>
              <ellipse cx="29" cy="14" rx="8" ry="4" fill="#FCC8C8" stroke="#E8A0A0" stroke-width="1.5"/>
              <rect x="27" y="8" width="4" height="8" rx="1.5" fill="#E8A0A0"/>
              <circle cx="22" cy="30" r="2.5" fill="#4A3525"/>
              <circle cx="36" cy="30" r="2.5" fill="#4A3525"/>
              <ellipse cx="29" cy="36" rx="6" ry="3.5" fill="#F0A8A8"/>
              <circle cx="29" cy="4" r="5" fill="#F8E8A8" stroke="#E8C860" stroke-width="1"/>
              <text x="29" y="6.5" text-anchor="middle" font-size="6" fill="#C8A040">¥</text>
            </svg>
          </div>
          <div class="card-decoration tape">
            <svg width="48" height="18" viewBox="0 0 48 18" fill="none"><rect x="2" y="2" width="44" height="14" rx="3" fill="#FCC8C8" opacity="0.7" transform="rotate(-8 24 9)"/><rect x="4" y="3" width="40" height="12" rx="2" fill="#FDD8D8" opacity="0.5" transform="rotate(-8 24 9)"/></svg>
          </div>
        </div>

        <!-- Card 4: 储蓄率 -->
        <div class="finance-card card-savings">
          <div class="card-body">
            <div class="card-header">
              <span class="card-label">储蓄率</span>
              <svg class="card-help" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#C8C0B8" stroke-width="1.2"/><path d="M6.2 6.2c.3-.6.9-1 1.7-1 .8 0 1.5.3 1.5 1.2 0 1.2-2 1.5-2 2.8" stroke="#C8C0B8" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.7" fill="#C8C0B8"/></svg>
            </div>
            <div class="card-value">{{ savingsRate }}%</div>
            <div class="card-change" :class="momChanges.savings >= 0 ? 'up' : 'down'">
              {{ Math.abs(momChanges.savings) < 0.05 ? '较上月 持平' : `较上月 ${momChanges.savings >= 0 ? '↑' : '↓'} ${Math.abs(momChanges.savings).toFixed(1)}%` }}
            </div>
          </div>
          <div class="card-icon-wrap">
            <svg class="card-icon" width="46" height="58" viewBox="0 0 46 58" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="12" width="26" height="34" rx="6" fill="#E8F0F8" stroke="#C0D8F0" stroke-width="1.5"/>
              <rect x="6" y="26" width="34" height="20" rx="6" fill="#F0F8FF" stroke="#C0D8F0" stroke-width="1.2"/>
              <rect x="14" y="6" width="18" height="12" rx="4" fill="#E0C8A8" stroke="#D0B898" stroke-width="1.2"/>
              <rect x="16" y="2" width="14" height="8" rx="3" fill="#E8D0B0" stroke="#D0B898" stroke-width="1"/>
              <path d="M16 20c2-3 6-2 7 0 1-2 5-3 7 0" stroke="#C0D0E8" stroke-width="1" stroke-linecap="round" fill="none"/>
              <path d="M33 44c-1.5 3-5 3-7 1" stroke="#F0A0A0" stroke-width="1.2" stroke-linecap="round" fill="none"/>
              <path d="M20 42c1 4 5 4 7 2" stroke="#F0A0A0" stroke-width="0.9" stroke-linecap="round" fill="none"/>
              <rect x="12" y="28" width="22" height="14" rx="4" fill="#D8E8F8" opacity="0.5"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- ═══ 3. Analytics Row: Trend / Donut / Savings Goal ═══ -->
      <div class="analytics-row">
        <!-- Module 1: Income vs Expense Trend -->
        <div class="analytics-card card-trend">
          <div class="analytics-card-header">
            <div class="header-left">
              <svg class="tape-deco tape-yellow" width="32" height="14" viewBox="0 0 32 14" fill="none">
                <rect x="1" y="1" width="30" height="12" rx="2" fill="#F8E8A8" stroke="#E8C860" stroke-width="0.8" transform="rotate(-3 16 7)"/>
                <line x1="4" y1="4" x2="4" y2="10" stroke="#E8C860" stroke-width="0.5" opacity="0.4"/>
                <line x1="10" y1="3.5" x2="10" y2="10" stroke="#E8C860" stroke-width="0.5" opacity="0.4"/>
                <line x1="16" y1="3" x2="16" y2="10" stroke="#E8C860" stroke-width="0.5" opacity="0.4"/>
                <line x1="22" y1="3.5" x2="22" y2="10" stroke="#E8C860" stroke-width="0.5" opacity="0.4"/>
                <line x1="28" y1="4" x2="28" y2="10" stroke="#E8C860" stroke-width="0.5" opacity="0.4"/>
              </svg>
              <span class="analytics-card-title">收入vs支出趋势</span>
            </div>
            <div class="period-select" @click="togglePeriod">
              <span>{{ trendPeriod === 6 ? '近6个月' : '近12个月' }}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#A89880" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div ref="trendRef" class="chart-box chart-box-trend"></div>
          <!-- Bear sticker -->
          <div class="card-sticker sticker-bear">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="#F5E6D8" stroke="#E0C4A8" stroke-width="1.2"/>
              <circle cx="13" cy="15" r="4.5" fill="#E8D0B8" stroke="#D8C0A8" stroke-width="0.8"/>
              <circle cx="27" cy="15" r="4.5" fill="#E8D0B8" stroke="#D8C0A8" stroke-width="0.8"/>
              <circle cx="13" cy="16" r="2" fill="#D0B898"/>
              <circle cx="27" cy="16" r="2" fill="#D0B898"/>
              <ellipse cx="20" cy="25" rx="7" ry="5.5" fill="#F2D8C8"/>
              <circle cx="17" cy="24.5" r="1.8" fill="#D0B898"/>
              <circle cx="23" cy="24.5" r="1.8" fill="#D0B898"/>
              <circle cx="14" cy="18" r="1.5" fill="#FCC8C8" opacity="0.6"/>
              <circle cx="26" cy="18" r="1.5" fill="#FCC8C8" opacity="0.6"/>
            </svg>
          </div>
        </div>

        <!-- Module 2: Expense Category Donut -->
        <div class="analytics-card card-donut">
          <div class="analytics-card-header">
            <span class="analytics-card-title">消费分类占比</span>
            <svg class="tape-deco tape-blue" width="32" height="14" viewBox="0 0 32 14" fill="none">
              <rect x="1" y="1" width="30" height="12" rx="2" fill="#D0E0F8" stroke="#A0C0E8" stroke-width="0.8" transform="rotate(5 16 7)"/>
              <line x1="4" y1="4" x2="4" y2="10" stroke="#A0C0E8" stroke-width="0.5" opacity="0.4"/>
              <line x1="10" y1="3.5" x2="10" y2="10" stroke="#A0C0E8" stroke-width="0.5" opacity="0.4"/>
              <line x1="16" y1="3" x2="16" y2="10" stroke="#A0C0E8" stroke-width="0.5" opacity="0.4"/>
              <line x1="22" y1="3.5" x2="22" y2="10" stroke="#A0C0E8" stroke-width="0.5" opacity="0.4"/>
              <line x1="28" y1="4" x2="28" y2="10" stroke="#A0C0E8" stroke-width="0.5" opacity="0.4"/>
            </svg>
          </div>
          <div v-if="pieData.length > 0" class="donut-content">
            <div ref="pieRef" class="donut-chart"></div>
            <div class="donut-legend">
              <div v-for="(item, i) in pieData" :key="item.id || i" class="legend-item">
                <span class="legend-dot" :style="{ background: DONUT_COLORS[i % DONUT_COLORS.length] }"></span>
                <span class="legend-name">{{ item.name }}</span>
                <span class="legend-pct">{{ item.amount > 0 && totalExpenseForPie > 0 ? Math.round((item.amount / totalExpenseForPie) * 100) : 0 }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-mini">
            <DogMascot :size="80" pose="peeking" />
            <p>暂无消费数据</p>
          </div>
          <div class="donut-footer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="#A0B898" stroke-width="1.2"/>
              <path d="M8 4v5M5 7l3 3 3-3" stroke="#A0B898" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>总支出 ¥{{ formatCurrency(totalExpenseForPie) }}</span>
          </div>
        </div>

        <!-- Module 3: Savings Goal Card -->
        <div class="analytics-card card-savings-goal">
          <div class="analytics-card-header">
            <span class="analytics-card-title">储蓄目标</span>
            <svg class="tape-deco tape-pink" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 4C9 4 3 5 3 9c0 3 3 4.5 3 7 0 2.5-1 4-1 4h14s-1-1.5-1-4c0-2.5 3-4 3-7 0-4-6-5-9-5z" fill="#F8C0C0" stroke="#E8A0A0" stroke-width="0.8"/>
              <path d="M7 10c1.5-2 4-1.5 5 0 1-1.5 3.5-2 5 0" stroke="#E8A0A0" stroke-width="0.7" fill="none"/>
            </svg>
          </div>
          <div class="savings-goal-body">
            <!-- Glass jar illustration -->
            <div class="jar-illustration">
              <svg width="80" height="90" viewBox="0 0 80 90" fill="none">
                <!-- Jar body -->
                <rect x="16" y="28" width="48" height="50" rx="10" fill="rgba(255,253,249,0.6)" stroke="#D0C8B8" stroke-width="1.2"/>
                <!-- Liquid fill -->
                <rect x="18" y="48" width="44" height="30" rx="8" fill="#D0E8C0" opacity="0.5"/>
                <!-- Lid -->
                <rect x="20" y="18" width="40" height="14" rx="5" fill="#F0D8C0" stroke="#E0C8A8" stroke-width="0.8"/>
                <rect x="22" y="20" width="36" height="10" rx="3" fill="#F5E0D0"/>
                <!-- Bow -->
                <path d="M26 20c-3-3-6 0-4 3 2-1 4-2 4-3z" fill="#F8C0C0"/>
                <path d="M54 20c3-3 6 0 4 3-2-1-4-2-4-3z" fill="#F8C0C0"/>
                <circle cx="40" cy="20" r="3" fill="#F8C8C8"/>
                <!-- Coins inside -->
                <circle cx="30" cy="55" r="6" fill="#F8E8A8" stroke="#E8C860" stroke-width="0.5"/>
                <circle cx="45" cy="52" r="6" fill="#F8E8A8" stroke="#E8C860" stroke-width="0.5"/>
                <circle cx="38" cy="60" r="5" fill="#F8E8A8" stroke="#E8C860" stroke-width="0.5"/>
              </svg>
            </div>
            <!-- Goal info -->
            <div class="goal-info">
              <div class="goal-name">
                <span>{{ savingsGoal.name }}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 2l1 4-4 3 2 5-4-2-3 2 2-5-5-3 4-1 3-3 4 3z" fill="#F8C878" stroke="#E8B858" stroke-width="0.5"/></svg>
              </div>
              <div class="goal-amount">¥{{ formatCurrency(savingsGoal.current) }}</div>
              <div class="goal-target">目标：¥{{ formatCurrency(savingsGoal.target) }}</div>
            </div>
          </div>
          <!-- Progress bar -->
          <div class="goal-progress-wrap">
            <div class="goal-progress-bar">
              <div class="goal-progress-fill" :style="{ width: Math.min(savingsGoal.percent, 100) + '%' }"></div>
            </div>
            <span class="goal-progress-tag">完成度 {{ savingsGoal.percent }}%</span>
          </div>
          <!-- Footer -->
          <div class="goal-footer" v-if="savingsGoal.expectedDate">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="2.5" width="11" height="10" rx="2" stroke="#C0B8A8" stroke-width="1"/>
              <line x1="1.5" y1="6" x2="12.5" y2="6" stroke="#C0B8A8" stroke-width="0.8"/>
              <line x1="5" y1="1" x2="5" y2="4" stroke="#C0B8A8" stroke-width="0.8" stroke-linecap="round"/>
              <line x1="9" y1="1" x2="9" y2="4" stroke="#C0B8A8" stroke-width="0.8" stroke-linecap="round"/>
            </svg>
            <span>预计完成：{{ savingsGoal.expectedDate }}</span>
          </div>
          <!-- Flower sticker -->
          <div class="card-sticker sticker-flower">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="6" fill="#F8C8C8"/>
              <circle cx="16" cy="6" r="5" fill="#FCC8C8" stroke="#F0B0B0" stroke-width="0.6"/>
              <circle cx="24" cy="10" r="5" fill="#FCC8C8" stroke="#F0B0B0" stroke-width="0.6"/>
              <circle cx="26" cy="20" r="5" fill="#FCC8C8" stroke="#F0B0B0" stroke-width="0.6"/>
              <circle cx="8" cy="10" r="5" fill="#FCC8C8" stroke="#F0B0B0" stroke-width="0.6"/>
              <circle cx="6" cy="20" r="5" fill="#FCC8C8" stroke="#F0B0B0" stroke-width="0.6"/>
              <circle cx="16" cy="16" r="4" fill="#F8E8A8"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- ═══ 4. Bottom Row: Recent Tx / Savings Jars / Budgets ═══ -->
      <div class="bottom-row">
        <!-- Recent Transactions -->
        <div class="chart-sticker bottom-card">
          <div class="card-header-row">
            <h3 class="section-title">📋 近期账单</h3>
            <button class="view-all" @click="goTx">查看全部 →</button>
          </div>
          <div v-if="recentItems.length > 0" class="tx-list">
            <div v-for="tx in recentItems" :key="tx.id" class="tx-row">
              <span class="tx-cat">{{ tx.category?.name || '未知' }}</span>
              <span class="tx-note">{{ tx.note || '' }}</span>
              <span :class="tx.type === 'income' ? 'tx-amount-in' : 'tx-amount-out'">
                {{ tx.type === 'income' ? '+' : '-' }}¥{{ Number(tx.amount).toFixed(2) }}
              </span>
            </div>
          </div>
          <div v-else class="empty-mini">
            <p>还没有记录</p>
          </div>
        </div>

        <!-- Savings Jars (compact) -->
        <div class="chart-sticker bottom-card">
          <div class="card-header-row">
            <h3 class="section-title">🐶 储蓄罐</h3>
            <button class="view-all" @click="showNewJar = !showNewJar">+ 新建</button>
          </div>
          <div v-if="jars.length === 0 && !showNewJar" class="empty-mini">
            <DogMascot :size="60" pose="sitting" />
            <p>创建你的第一个储蓄目标吧 ~</p>
          </div>
          <div class="jars-list-compact" v-if="jars.length > 0 || showNewJar">
            <SavingsJar
              v-for="jar in jars" :key="jar.id"
              :jar="jar"
              @updated="onJarUpdated"
              @deleted="onJarDeleted"
            />
            <div v-if="showNewJar" class="new-jar-card">
              <DogMascot :size="50" pose="peeking" />
              <input v-model="newJarForm.name" class="jar-input" placeholder="目标名称" />
              <input v-model="newJarForm.targetAmount" class="jar-input" type="number" placeholder="目标金额" min="0" />
              <div class="jar-form-btns">
                <button class="jar-save-btn" :disabled="creatingJar" @click="createJar">
                  {{ creatingJar ? '...' : '创建' }}
                </button>
                <button class="jar-cancel-btn" @click="showNewJar = false">取消</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Budget Progress -->
        <div class="chart-sticker bottom-card">
          <h3 class="section-title">📊 本月预算进度</h3>
          <div v-if="budgets.length > 0" class="budget-list">
            <div v-for="b in budgets" :key="b.id" class="budget-row">
              <div class="budget-top">
                <span class="budget-cat">{{ b.categoryName }}</span>
                <span class="budget-nums">¥{{ b.spentAmount.toLocaleString() }} / ¥{{ b.budgetAmount.toLocaleString() }}</span>
              </div>
              <div class="budget-bar">
                <div class="budget-fill" :class="budgetProgressClass(b.percent)" :style="{ width: b.percent + '%' }"></div>
              </div>
              <span class="budget-remain" :class="{ over: b.percent > 100 }">
                {{ b.percent > 100 ? '超支 ¥' + Math.abs(b.remaining).toLocaleString() : '剩余 ¥' + b.remaining.toLocaleString() }}
              </span>
            </div>
          </div>
          <div v-else class="empty-mini">
            <DogMascot :size="60" pose="sitting" />
            <p>还没有设置预算</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-lg) 0;
}

/* ── Loading ── */
.loading-state {
  text-align: center;
  padding: var(--space-3xl) 0;
  color: var(--color-muted);
}
.loading-state p { margin-top: var(--space-md); font-size: 15px; }

/* ── 1. Greeting ── */
.greeting-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-lg);
}
.greeting-title {
  font-size: 26px;
  color: var(--color-ink);
}
.greeting-emoji { font-size: 28px; }
.greeting-days {
  font-size: 14px;
  color: var(--color-muted);
  margin-top: 4px;
}
.days-count {
  font-family: var(--font-round);
  font-size: 18px;
  color: #E0A0A0;
  font-weight: 700;
}
.greeting-date {
  font-size: 14px;
  color: var(--color-muted);
}

/* ── 2. Finance Sticker Cards ── */
.summary-stickers {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.finance-card {
  position: relative;
  border-radius: 24px;
  padding: 20px 16px 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.33, 0, 0.67, 1);
  cursor: default;
}

.finance-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(139, 107, 82, 0.10);
}

.card-income {
  background: linear-gradient(135deg, #FFF5F5 0%, #FFF0F0 100%);
  border: 1px solid #F8C8C8;
}

.card-expense {
  background: linear-gradient(135deg, #F5FFF5 0%, #F0FFF0 100%);
  border: 1px solid #C8E8C8;
}

.card-balance {
  background: linear-gradient(135deg, #FFFCF5 0%, #FFF9E8 100%);
  border: 1px solid #F8E8C8;
}

.card-savings {
  background: linear-gradient(135deg, #F8FBFF 0%, #F0F8FF 100%);
  border: 1px solid #C8E0F8;
}

.card-body {
  flex: 1;
  min-width: 0;
  z-index: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.card-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-muted);
  font-family: var(--font-body);
}

.card-help {
  flex-shrink: 0;
  opacity: 0.6;
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-ink);
  font-family: var(--font-round);
  line-height: 1.2;
  margin-bottom: 4px;
}

.card-change {
  font-size: 12px;
  font-family: var(--font-body);
  font-weight: 500;
}

.card-change.up { color: #E0A0A0; }
.card-change.down { color: #A0B898; }
.card-change.expense-change.good { color: #80B080; }
.card-change.expense-change.bad { color: #E0A0A0; }

.card-icon-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.card-icon {
  filter: drop-shadow(0 2px 4px rgba(139, 107, 82, 0.10));
}

.card-decoration {
  position: absolute;
  z-index: 0;
  pointer-events: none;
}

.card-decoration.star {
  bottom: 8px;
  right: 10px;
  opacity: 0.7;
}

.card-decoration.tape {
  top: -4px;
  right: -6px;
  opacity: 0.8;
}

/* ── 3. Analytics Row ── */
.analytics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.analytics-card {
  position: relative;
  background: var(--color-surface);
  border-radius: 20px;
  box-shadow: var(--shadow-md);
  padding: 18px 16px 14px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.33, 0, 0.67, 1);
}

.analytics-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(139, 107, 82, 0.10);
}

/* Card header */
.analytics-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.analytics-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-caramel);
  font-family: var(--font-round);
}

/* Tape decorations */
.tape-deco {
  flex-shrink: 0;
}

/* Period selector */
.period-select {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #FFFDF9;
  border: 1px solid #E8E0D8;
  border-radius: 16px;
  font-size: 12px;
  color: var(--color-muted);
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.2s;
}
.period-select:hover {
  border-color: #D0C8B8;
}

/* Chart boxes */
.chart-box-trend {
  width: 100%;
  height: 220px;
}

/* Donut content */
.donut-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.donut-chart {
  width: 170px;
  height: 170px;
  flex-shrink: 0;
}

.donut-legend {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name {
  color: var(--color-ink);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-pct {
  color: var(--color-muted);
  font-weight: 600;
  flex-shrink: 0;
}

.donut-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #E8E0D8;
  font-size: 13px;
  color: #6A8F5E;
  font-weight: 600;
  font-family: var(--font-round);
}

/* Savings goal card */
.card-savings-goal {
  display: flex;
  flex-direction: column;
}

.savings-goal-body {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.jar-illustration {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goal-info {
  flex: 1;
  min-width: 0;
}

.goal-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: 4px;
}

.goal-amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-ink);
  font-family: var(--font-round);
  line-height: 1.2;
  margin-bottom: 4px;
}

.goal-target {
  font-size: 12px;
  color: var(--color-muted);
}

/* Progress bar */
.goal-progress-wrap {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.goal-progress-bar {
  flex: 1;
  height: 10px;
  background: #F0EAE2;
  border-radius: 5px;
  overflow: hidden;
}

.goal-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #B8D8A8 0%, #80C080 100%);
  border-radius: 5px;
  transition: width 0.6s cubic-bezier(0.33, 0, 0.67, 1);
}

.goal-progress-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-caramel);
  background: #FDF3D0;
  padding: 2px 10px;
  border-radius: 10px;
  white-space: nowrap;
  font-family: var(--font-round);
}

.goal-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-muted);
}

/* Card stickers */
.card-sticker {
  position: absolute;
  z-index: 0;
  pointer-events: none;
}

.sticker-bear {
  bottom: 6px;
  left: 6px;
  opacity: 0.75;
}

.sticker-flower {
  bottom: 6px;
  right: 6px;
  opacity: 0.7;
}

/* ── Common chart sticker ── */
.chart-sticker {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-lg);
  margin-bottom: 0;
}
.section-title {
  font-size: 17px;
  color: var(--color-caramel);
  margin-bottom: var(--space-md);
  font-family: var(--font-round);
}
.empty-mini {
  text-align: center;
  padding: var(--space-lg) 0;
  color: var(--color-muted);
}
.empty-mini p { margin-top: var(--space-sm); font-size: 14px; }

/* ── 4. Bottom Row ── */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-md);
}
.bottom-card { margin-bottom: 0; }
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}
.card-header-row .section-title { margin-bottom: 0; }
.view-all {
  font-size: 13px;
  color: var(--color-caramel);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
}
.view-all:hover { opacity: 0.7; }

/* Tx list */
.tx-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 0;
  border-bottom: 1px solid #F5F0EA;
  font-size: 13px;
}
.tx-row:last-child { border-bottom: none; }
.tx-cat { font-weight: 600; color: var(--color-ink); white-space: nowrap; }
.tx-note { color: var(--color-muted); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tx-amount-in { color: #6A8F5E; font-weight: 700; font-family: var(--font-round); white-space: nowrap; }
.tx-amount-out { color: #C08080; font-weight: 700; font-family: var(--font-round); white-space: nowrap; }

/* Budget progress */
.budget-row { margin-bottom: var(--space-md); }
.budget-row:last-child { margin-bottom: 0; }
.budget-top { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
.budget-cat { font-weight: 600; color: var(--color-ink); }
.budget-nums { color: var(--color-muted); font-size: 12px; }
.budget-bar { height: 6px; background: #F0EAE2; border-radius: 3px; overflow: hidden; }
.budget-fill { height: 100%; border-radius: 3px; transition: width 0.6s var(--ease-gentle); }
.budget-fill.safe { background: var(--color-sage); }
.budget-fill.warning { background: var(--color-gold); }
.budget-fill.exceeded { background: var(--color-peach); }
.budget-remain { font-size: 11px; color: var(--color-muted); }
.budget-remain.over { color: #C08080; }

/* Savings jars compact */
.jars-list-compact {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  padding-bottom: var(--space-sm);
}

/* New jar form */
.new-jar-card {
  min-width: 150px;
  background: #FDF9F2;
  border: 1.5px dashed #E8E0D8;
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.jar-input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  font-size: 13px;
  font-family: var(--font-body);
  color: var(--color-ink);
  background: var(--color-surface);
  border: none;
  border-radius: var(--radius-sm);
  box-shadow: 0 0 0 1px #E8E0D8;
  outline: none;
  text-align: center;
}
.jar-input:focus { box-shadow: 0 0 0 2px rgba(247, 214, 214, 0.5); }
.jar-form-btns { display: flex; gap: 6px; width: 100%; }
.jar-save-btn, .jar-cancel-btn {
  flex: 1;
  padding: 6px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--font-round);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
}
.jar-save-btn {
  background: var(--color-peach);
  color: var(--color-caramel);
}
.jar-cancel-btn { background: #F0EAE2; color: var(--color-muted); }
.jar-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Responsive ── */
@media (max-width: 1000px) {
  .analytics-row {
    grid-template-columns: 1fr 1fr;
  }
  .analytics-row .card-trend {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .bottom-row {
    grid-template-columns: 1fr;
  }
  .summary-stickers {
    grid-template-columns: repeat(2, 1fr);
  }
  .analytics-row {
    grid-template-columns: 1fr;
  }
  .analytics-row .card-trend {
    grid-column: auto;
  }
}

@media (max-width: 480px) {
  .greeting-row { flex-direction: column; align-items: flex-start; gap: var(--space-sm); }
  .greeting-title { font-size: 22px; }
  .summary-stickers { grid-template-columns: 1fr; }
  .donut-content { flex-direction: column; align-items: center; }
}

@media (prefers-reduced-motion: reduce) {
  .finance-card, .analytics-card, .new-jar-btn, .budget-fill, .goal-progress-fill {
    transition: none;
  }
  .finance-card:hover, .analytics-card:hover { transform: none; }
}
</style>

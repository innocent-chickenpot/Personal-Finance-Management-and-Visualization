<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getTransactions, deleteTransaction } from '@/api/transactions'
import { getCategories } from '@/api/categories'
import { getPaymentMethods } from '@/api/paymentMethods'
import { ElMessage, ElMessageBox } from 'element-plus'
import DogMascot from '@/components/DogMascot.vue'

const router = useRouter()

const loading = ref(false)
const items = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filters = ref({
  type: '',
  category_id: '',
  payment_method_id: '',
  date_range: []
})
const categories = ref([])
const paymentMethods = ref([])

onMounted(async () => {
  const [catRes, pmRes] = await Promise.all([
    getCategories(),
    getPaymentMethods()
  ])
  if (catRes.code === 200) categories.value = catRes.data
  if (pmRes.code === 200) paymentMethods.value = pmRes.data
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filters.value.type) params.type = filters.value.type
    if (filters.value.category_id) params.category_id = filters.value.category_id
    if (filters.value.payment_method_id) params.payment_method_id = filters.value.payment_method_id
    if (filters.value.date_range?.length === 2) {
      params.start_date = filters.value.date_range[0]
      params.end_date = filters.value.date_range[1]
    }
    const res = await getTransactions(params)
    if (res.code === 200) {
      items.value = res.data.items
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  fetchData()
}

watch(page, fetchData)

function handleDelete(item) {
  ElMessageBox.confirm('确定要删除这条记录吗？', '确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await deleteTransaction(item.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchData()
    }
  }).catch(() => {})
}

function getTypeTag(type) {
  return type === 'income' ? 'success' : 'danger'
}

function getTypeText(type) {
  return type === 'income' ? '收入' : '支出'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${dd} ${h}:${mi}:${s}`
}
</script>

<template>
  <div class="transactions-page">
    <div class="page-top">
      <div>
        <h2>收支记录</h2>
        <p class="page-desc">{{ total }} 条记录</p>
      </div>
      <button class="sticker-btn primary" @click="router.push('/transactions/new')">
        <span>✏️</span> 新增记录
      </button>
    </div>

    <!-- Filters -->
    <div class="filter-sticker">
      <el-row :gutter="12">
        <el-col :sm="4" :xs="12">
          <el-select v-model="filters.type" placeholder="全部类型" clearable @change="onFilterChange" style="width:100%">
            <el-option label="全部类型" value="" />
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
        </el-col>
        <el-col :sm="4" :xs="12">
          <el-select v-model="filters.category_id" placeholder="全部分类" clearable @change="onFilterChange" style="width:100%">
            <el-option label="全部分类" :value="undefined" />
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-col>
        <el-col :sm="4" :xs="12">
          <el-select v-model="filters.payment_method_id" placeholder="全部渠道" clearable @change="onFilterChange" style="width:100%">
            <el-option label="全部渠道" :value="undefined" />
            <el-option v-for="p in paymentMethods" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-col>
        <el-col :sm="8" :xs="12">
          <el-date-picker
            v-model="filters.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="onFilterChange"
            style="width:100%"
          />
        </el-col>
      </el-row>
    </div>

    <!-- Table -->
    <div class="table-sticker">
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column label="日期" width="180" prop="createdAt" sortable>
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category.name" label="分类" width="100" />
        <el-table-column label="金额" width="140">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'amount-in' : 'amount-out'">
              {{ row.type === 'income' ? '+' : '-' }}{{ Number(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod.name" label="支付渠道" width="110" />
        <el-table-column prop="note" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="router.push(`/transactions/${row.id}`)">编辑</el-button>
            <el-button text size="small" style="color:#C08080" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && items.length === 0" class="empty-state">
        <DogMascot :size="100" pose="peeking" />
        <p>还没有收支记录，开始记录吧 ~</p>
      </div>

      <div v-if="total > 0" class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.transactions-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-lg) 0;
}

/* ── Top ── */
.page-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
}

.page-top h2 {
  font-size: 24px;
}

.page-desc {
  font-size: 13px;
  color: var(--color-muted);
  margin-top: 2px;
}

/* ── Sticker Button ── */
.sticker-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 10px 22px;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-round);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
  background: var(--color-surface);
  color: var(--color-ink);
  box-shadow: var(--shadow-md);
}

.sticker-btn:hover {
  transform: scale(1.04);
  box-shadow: var(--shadow-lg);
}

.sticker-btn:active {
  transform: scale(0.97);
}

.sticker-btn.primary {
  background: var(--color-peach);
  color: var(--color-caramel);
}

@media (prefers-reduced-motion: reduce) {
  .sticker-btn {
    transition: none;
  }
  .sticker-btn:hover {
    transform: none;
  }
}

/* ── Filter Sticker ── */
.filter-sticker {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-md);
}

/* ── Table Sticker ── */
.table-sticker {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-md);
}

.amount-in {
  color: #6A8F5E;
  font-weight: 700;
  font-family: var(--font-round);
}

.amount-out {
  color: #C08080;
  font-weight: 700;
  font-family: var(--font-round);
}

/* ── Empty ── */
.empty-state {
  text-align: center;
  padding: var(--space-2xl) 0;
  color: var(--color-muted);
}

.empty-state p {
  margin-top: var(--space-md);
  font-size: 15px;
}

/* ── Pagination ── */
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid #F0EAE2;
}
</style>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createTransaction, updateTransaction, getTransactions } from '@/api/transactions'
import { getCategories } from '@/api/categories'
import { getPaymentMethods } from '@/api/paymentMethods'
import { ElMessage } from 'element-plus'
import DogMascot from '@/components/DogMascot.vue'

const router = useRouter()
const route = useRoute()
const isEdit = ref(!!route.params.id)
const loading = ref(false)

const form = ref({
  type: 'expense',
  amount: null,
  category_id: '',
  payment_method_id: '',
  transaction_date: '',
  note: ''
})

const categories = ref([])
const paymentMethods = ref([])
const filteredCategories = ref([])

watch(() => form.value.type, updateCategories)

function updateCategories() {
  filteredCategories.value = categories.value.filter(c => c.type === form.value.type)
}

function dateAfterToday(time) {
  return time.getTime() > Date.now()
}

onMounted(async () => {
  const [catRes, pmRes] = await Promise.all([
    getCategories(),
    getPaymentMethods()
  ])
  if (catRes.code === 200) categories.value = catRes.data
  if (pmRes.code === 200) paymentMethods.value = pmRes.data
  updateCategories()

  if (isEdit.value) {
    const res = await getTransactions({ page: 1, pageSize: 1 })
    if (res.code === 200) {
      const item = res.data.items.find(i => i.id === Number(route.params.id))
      if (item) {
        form.value = {
          type: item.type,
          amount: Number(item.amount),
          category_id: item.categoryId,
          payment_method_id: item.paymentMethodId,
          transaction_date: item.transactionDate,
          note: item.note || ''
        }
      }
    }
  }
})

async function submit() {
  if (!form.value.amount || !form.value.category_id || !form.value.payment_method_id || !form.value.transaction_date) {
    ElMessage.warning('请填写所有必填字段')
    return
  }
  if (Number(form.value.amount) <= 0) {
    ElMessage.warning('金额必须大于0')
    return
  }

  loading.value = true
  try {
    const data = {
      type: form.value.type,
      amount: Number(form.value.amount),
      category_id: Number(form.value.category_id),
      payment_method_id: Number(form.value.payment_method_id),
      transaction_date: form.value.transaction_date,
      note: form.value.note || ''
    }

    if (isEdit.value) {
      const res = await updateTransaction(route.params.id, data)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        router.push('/transactions')
      }
    } else {
      const res = await createTransaction(data)
      if (res.code === 200) {
        ElMessage.success('添加成功')
        router.push('/')
      }
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="form-page">
    <div class="form-top">
      <h2>{{ isEdit ? '编辑记录' : '新增记录' }}</h2>
      <DogMascot :size="70" :pose="isEdit ? 'sitting' : 'peeking'" />
    </div>

    <div class="form-sticker">
      <div class="type-toggle">
        <button
          :class="['type-btn', { active: form.type === 'expense' }]"
          @click="form.type = 'expense'"
        >💸 支出</button>
        <button
          :class="['type-btn', { active: form.type === 'income' }]"
          @click="form.type = 'income'"
        >💰 收入</button>
      </div>

      <div class="field-group">
        <label class="field-label">金额 <span class="required">*</span></label>
        <el-input-number
          v-model="form.amount"
          :min="0.01"
          :precision="2"
          :step="100"
          placeholder="0.00"
          :controls="false"
          style="width:100%"
        />
      </div>

      <div class="field-group">
        <label class="field-label">分类 <span class="required">*</span></label>
        <el-select v-model="form.category_id" placeholder="选择分类" style="width:100%">
          <el-option v-for="c in filteredCategories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </div>

      <div class="field-group">
        <label class="field-label">支付渠道 <span class="required">*</span></label>
        <el-select v-model="form.payment_method_id" placeholder="选择支付渠道" style="width:100%">
          <el-option v-for="p in paymentMethods" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </div>

      <div class="field-group">
        <label class="field-label">日期 <span class="required">*</span></label>
        <el-date-picker
          v-model="form.transaction_date"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :disabled-date="dateAfterToday"
          style="width:100%"
        />
      </div>

      <div class="field-group">
        <label class="field-label">备注</label>
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="写点什么吧..."
          maxlength="200"
          show-word-limit
        />
      </div>

      <div class="form-actions">
        <button class="sticker-btn primary" :disabled="loading" @click="submit">
          {{ loading ? '保存中...' : (isEdit ? '💾 保存修改' : '✨ 提交记录') }}
        </button>
        <button class="sticker-btn" @click="router.push('/transactions')">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-page {
  max-width: 560px;
  margin: 0 auto;
  padding: var(--space-lg) 0;
}

.form-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.form-top h2 {
  font-size: 24px;
}

/* ── Form Sticker ── */
.form-sticker {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-xl);
}

/* ── Type Toggle ── */
.type-toggle {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.type-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  font-family: var(--font-round);
  background: #F5F0EA;
  color: var(--color-muted);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
}

.type-btn:hover {
  background: #EDE5DC;
}

.type-btn.active {
  background: var(--color-peach);
  color: var(--color-caramel);
  box-shadow: var(--shadow-sm);
}

/* ── Field ── */
.field-group {
  margin-bottom: var(--space-md);
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-caramel);
  margin-bottom: 6px;
}

.required {
  color: #C08080;
}

/* ── Actions ── */
.form-actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid #F0EAE2;
}

.sticker-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-round);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
  background: #F5F0EA;
  color: var(--color-ink);
}

.sticker-btn:hover:not(:disabled) {
  transform: scale(1.03);
  box-shadow: var(--shadow-md);
}

.sticker-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.sticker-btn.primary {
  background: var(--color-peach);
  color: var(--color-caramel);
}

.sticker-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .sticker-btn, .type-btn {
    transition: none;
  }
  .sticker-btn:hover, .type-btn:hover {
    transform: none;
  }
}
</style>

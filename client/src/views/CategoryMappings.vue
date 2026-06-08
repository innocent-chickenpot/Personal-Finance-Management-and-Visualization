<script setup>
import { ref, onMounted } from 'vue'
import { getCategoryMappings, saveCategoryMappings } from '@/api/categoryMappings'
import { getCategories } from '@/api/categories'
import { ElMessage } from 'element-plus'
import DogMascot from '@/components/DogMascot.vue'

const SOURCES = ['wechat', 'alipay']
const SOURCE_LABELS = { wechat: '微信', alipay: '支付宝' }

const activeSource = ref('wechat')
const mappings = ref([])
const categories = ref([])
const loading = ref(false)
const saving = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const [catRes] = await Promise.all([
      getCategories(),
      fetchMappings()
    ])
    if (catRes.code === 200) categories.value = catRes.data
  } finally {
    loading.value = false
  }
})

async function fetchMappings() {
  const res = await getCategoryMappings(activeSource.value)
  if (res.code === 200) mappings.value = res.data
}

async function switchSource(source) {
  activeSource.value = source
  await fetchMappings()
}

function addMapping() {
  mappings.value.push({
    id: null,
    source: activeSource.value,
    sourceName: '',
    categoryId: null,
    category: null,
    _new: true
  })
}

function removeMapping(idx) {
  mappings.value.splice(idx, 1)
}

async function saveAll() {
  saving.value = true
  try {
    const payload = mappings.value.map(m => ({
      source: m.source || activeSource.value,
      sourceName: m.sourceName.trim(),
      categoryId: m.categoryId
    }))
    const res = await saveCategoryMappings(payload)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      await fetchMappings()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mappings-page">
    <div class="page-top">
      <div>
        <h2>分类映射设置</h2>
        <p class="page-desc">建立微信/支付宝账单分类到系统分类的映射规则，导入时自动匹配</p>
      </div>
    </div>

    <!-- Source Tabs -->
    <div class="source-tabs">
      <button
        v-for="s in SOURCES" :key="s"
        :class="['source-tab', { active: activeSource === s }]"
        @click="switchSource(s)"
      >
        {{ SOURCE_LABELS[s] }}
      </button>
    </div>

    <!-- Mappings Table -->
    <div class="mappings-card" v-loading="loading">
      <div v-if="mappings.length === 0 && !loading" class="empty-state">
        <DogMascot :size="80" pose="peeking" />
        <p>还没有 {{ SOURCE_LABELS[activeSource] }} 的分类映射规则</p>
        <button class="add-btn" @click="addMapping">添加映射</button>
      </div>

      <table v-else class="mappings-table">
        <thead>
          <tr>
            <th>{{ SOURCE_LABELS[activeSource] }} 原始分类名</th>
            <th>映射到系统分类</th>
            <th style="width:60px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(m, idx) in mappings" :key="idx">
            <td>
              <input
                v-model="m.sourceName"
                type="text"
                class="text-input"
                :placeholder="'如：商户消费、餐饮美食'"
              />
            </td>
            <td>
              <select v-model="m.categoryId" class="cat-select">
                <option :value="null" disabled>选择分类</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">
                  {{ c.type === 'income' ? '[收入]' : '[支出]' }} {{ c.name }}
                </option>
              </select>
            </td>
            <td>
              <button class="del-btn" @click="removeMapping(idx)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="mappings.length > 0" class="mappings-footer">
        <button class="add-btn-ghost" @click="addMapping">+ 添加规则</button>
        <button class="save-btn" @click="saveAll" :disabled="saving">
          {{ saving ? '保存中...' : '保存全部' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mappings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-lg) 0;
}

.page-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
}

.page-top h2 { font-size: 24px; }

.page-desc {
  font-size: 13px;
  color: var(--color-muted);
  margin-top: 2px;
}

/* ── Source Tabs ── */
.source-tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.source-tab {
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-round);
  cursor: pointer;
  background: var(--color-surface);
  color: var(--color-muted);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal) var(--ease-gentle);
}

.source-tab.active {
  background: var(--color-peach);
  color: var(--color-caramel);
  box-shadow: var(--shadow-md);
}

.source-tab:hover:not(.active) { background: #F5F0EA; }

/* ── Mappings Card ── */
.mappings-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-md);
}

.mappings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.mappings-table th {
  text-align: left;
  padding: 10px;
  color: var(--color-muted);
  font-weight: 600;
  border-bottom: 1px solid #F0EAE2;
}

.mappings-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #F8F5F0;
}

.text-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E8E0D8;
  border-radius: 12px;
  font-size: 13px;
  color: var(--color-ink);
  background: var(--color-bg);
  outline: none;
  transition: box-shadow var(--duration-fast) var(--ease-gentle);
}

.text-input:focus { box-shadow: 0 0 0 2px rgba(247, 214, 214, 0.6); }

.cat-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E8E0D8;
  border-radius: 12px;
  font-size: 13px;
  color: var(--color-ink);
  background: var(--color-bg);
  outline: none;
}

.del-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  color: #C08080;
  background: transparent;
  cursor: pointer;
}

.del-btn:hover { background: #FFF0F0; }

/* ── Footer ── */
.mappings-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid #F0EAE2;
}

.add-btn-ghost {
  padding: 8px 16px;
  border: 1px dashed #E8D0C0;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-caramel);
  background: transparent;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
}

.add-btn-ghost:hover { background: #FDF7F2; }

.save-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-round);
  cursor: pointer;
  background: var(--color-peach);
  color: var(--color-caramel);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-normal) var(--ease-gentle);
}

.save-btn:hover { transform: scale(1.03); }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* ── Empty ── */
.empty-state {
  text-align: center;
  padding: var(--space-2xl) 0;
  color: var(--color-muted);
}

.empty-state p {
  margin: var(--space-md) 0;
  font-size: 15px;
}

.add-btn {
  padding: 10px 22px;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-round);
  cursor: pointer;
  background: var(--color-peach);
  color: var(--color-caramel);
  box-shadow: var(--shadow-md);
}
</style>

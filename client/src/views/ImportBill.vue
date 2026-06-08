<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { parseBill, importParsed } from '@/api/transactions'
import { getCategories } from '@/api/categories'
import { ElMessage, ElMessageBox } from 'element-plus'
import DogMascot from '@/components/DogMascot.vue'

const router = useRouter()

const SOURCE_LABELS = { wechat: '微信', alipay: '支付宝' }
const TYPE_LABELS = { income: '收入', expense: '支出' }

const uploading = ref(false)
const previewData = ref(null)
const selectedRecords = ref(new Set())
const modifiedCategories = ref({})
const categories = ref([])
const uploadingFile = ref(false)

// Parse uploaded files
async function handleUpload(files) {
  const fileList = files?.target?.files || files
  if (!fileList || fileList.length === 0) return

  uploadingFile.value = true
  previewData.value = null

  try {
    const formData = new FormData()
    for (const f of fileList) {
      formData.append('files', f)
    }
    const res = await parseBill(formData)
    if (res.code === 200) {
      const { records, summary, errors } = res.data

      // Auto-select all new records
      selectedRecords.value = new Set()
      records.forEach((r, i) => {
        if (r.status === 'new') selectedRecords.value.add(i)
      })

      // Fetch categories for manual adjustment
      const catRes = await getCategories()
      if (catRes.code === 200) categories.value = catRes.data
      modifiedCategories.value = {}

      previewData.value = { records, summary, errors }
    } else {
      ElMessage.error(res.message || '解析失败')
    }
  } catch (e) {
    ElMessage.error('解析失败，请检查文件格式')
  } finally {
    uploadingFile.value = false
  }
}

function toggleRecord(idx) {
  if (previewData.value.records[idx].status === 'duplicate') return
  const newSet = new Set(selectedRecords.value)
  if (newSet.has(idx)) newSet.delete(idx)
  else newSet.add(idx)
  selectedRecords.value = newSet
}

function onCategoryChange(idx, categoryId) {
  modifiedCategories.value[idx] = Number(categoryId)
}

function isSelected(idx) {
  return selectedRecords.value.has(idx)
}

async function confirmImport() {
  const records = previewData.value.records
    .filter((_r, i) => isSelected(i))
    .map((r, i) => ({
      ...r,
      categoryId: modifiedCategories.value[i] || r.matchedCategoryId || null
    }))

  if (records.length === 0) {
    ElMessage.warning('请至少选择一条记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认导入 ${records.length} 条记录？`,
      '确认导入',
      { confirmButtonText: '确定导入', cancelButtonText: '取消', type: 'info' }
    )
    uploading.value = true
    const res = await importParsed(records)
    if (res.code === 200) {
      ElMessage.success(`成功导入 ${res.data.imported} 条，跳过 ${res.data.skipped} 条重复`)
      previewData.value = null
      selectedRecords.value = new Set()
      router.push('/transactions')
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('导入失败')
  } finally {
    uploading.value = false
  }
}

function resetAll() {
  previewData.value = null
  selectedRecords.value = new Set()
  modifiedCategories.value = {}
}

function getCategoryName(categoryId) {
  const cat = categories.value.find(c => c.id === categoryId)
  return cat ? cat.name : '待分类'
}
</script>

<template>
  <div class="import-page">
    <div class="page-top">
      <div>
        <h2>账单导入</h2>
        <p class="page-desc">上传微信或支付宝的账单文件，自动解析并导入</p>
      </div>
    </div>

    <!-- Upload Area -->
    <div v-if="!previewData" class="upload-card">
      <div class="upload-zone" @dragover.prevent @drop.prevent="e => handleUpload(e.dataTransfer)">
        <DogMascot :size="80" pose="peeking" />
        <p class="upload-title">拖拽或点击选择账单文件</p>
        <p class="upload-hint">支持微信导出的 .xlsx 和支付宝导出的 .csv</p>
        <label class="upload-btn">
          <span>选择文件</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            style="display:none"
            @change="handleUpload"
          />
        </label>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="uploadingFile" class="upload-card">
      <div class="upload-zone">
        <DogMascot :size="80" pose="sitting" />
        <p class="upload-title">解析中...</p>
      </div>
    </div>

    <!-- Preview -->
    <div v-if="previewData && !uploadingFile" class="preview-section">
      <!-- Summary bar -->
      <div class="preview-summary">
        <div class="summary-item">
          <span class="sum-label">共解析</span>
          <span class="sum-value">{{ previewData.summary.total }}</span>
          <span class="sum-label">条</span>
        </div>
        <div class="summary-item new">
          <span class="sum-label">新增</span>
          <span class="sum-value">{{ previewData.summary.newCount }}</span>
          <span class="sum-label">条</span>
        </div>
        <div class="summary-item dup">
          <span class="sum-label">重复(跳过)</span>
          <span class="sum-value">{{ previewData.summary.duplicateCount }}</span>
          <span class="sum-label">条</span>
        </div>
        <div class="summary-actions">
          <button class="action-btn ghost" @click="resetAll">重新选择</button>
          <button class="action-btn primary" @click="confirmImport" :disabled="uploading">
            {{ uploading ? '导入中...' : `确认导入 (${selectedRecords.size} 条)` }}
          </button>
        </div>
      </div>

      <!-- Errors -->
      <div v-if="previewData.errors.length > 0" class="error-list">
        <p v-for="(e, i) in previewData.errors" :key="i" class="error-item">⚠ {{ e.file }}: {{ e.message }}</p>
      </div>

      <!-- Records table -->
      <div class="preview-table-wrap">
        <table class="preview-table">
          <thead>
            <tr>
              <th style="width:40px"></th>
              <th style="width:100px">来源</th>
              <th style="width:120px">日期</th>
              <th>分类</th>
              <th style="width:70px">类型</th>
              <th style="width:100px">金额</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, idx) in previewData.records"
              :key="idx"
              :class="{ duplicate: r.status === 'duplicate', selected: isSelected(idx) }"
              @click="toggleRecord(idx)"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="isSelected(idx)"
                  :disabled="r.status === 'duplicate'"
                  @click.stop
                  @change="toggleRecord(idx)"
                />
              </td>
              <td>
                <span :class="`source-tag source-${r.source}`">{{ SOURCE_LABELS[r.source] || r.source }}</span>
              </td>
              <td>{{ r.transactionDate }}</td>
              <td>
                <select
                  v-if="r.status === 'new'"
                  :value="modifiedCategories[idx] || r.matchedCategoryId || ''"
                  @change="onCategoryChange(idx, $event.target.value)"
                  @click.stop
                  class="cat-select"
                >
                  <option value="" disabled>待分类</option>
                  <option
                    v-for="c in categories"
                    :key="c.id"
                    :value="c.id"
                    :disabled="c.type !== r.type"
                  >
                    {{ c.name }}
                  </option>
                </select>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <span :class="`type-tag type-${r.type}`">{{ TYPE_LABELS[r.type] }}</span>
              </td>
              <td :class="r.type === 'income' ? 'amount-in' : 'amount-out'">
                {{ r.type === 'income' ? '+' : '-' }}{{ Number(r.amount).toFixed(2) }}
              </td>
              <td class="note-cell">
                <div class="note-text">{{ r.note }}</div>
                <div v-if="r.status === 'duplicate'" class="dup-badge">已存在</div>
                <div v-else-if="!r.matchedCategoryId && !modifiedCategories[idx]" class="uncat-badge">待分类</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-page {
  max-width: 1100px;
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

/* ── Upload ── */
.upload-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-2xl);
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-2xl);
  border: 2px dashed #E8E0D8;
  border-radius: var(--radius-md);
  text-align: center;
  transition: border-color var(--duration-normal) var(--ease-gentle);
}

.upload-zone:hover { border-color: var(--color-peach); }

.upload-title {
  font-family: var(--font-round);
  font-size: 17px;
  color: var(--color-caramel);
  font-weight: 600;
}

.upload-hint {
  font-size: 13px;
  color: var(--color-muted);
  margin-bottom: var(--space-sm);
}

.upload-btn {
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
  background: var(--color-peach);
  color: var(--color-caramel);
  transition: all var(--duration-normal) var(--ease-gentle);
  box-shadow: var(--shadow-md);
}

.upload-btn:hover {
  transform: scale(1.04);
  box-shadow: var(--shadow-lg);
}

/* ── Summary Bar ── */
.preview-summary {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.sum-label { font-size: 13px; color: var(--color-muted); }
.sum-value { font-size: 20px; font-weight: 700; font-family: var(--font-round); color: var(--color-caramel); }

.summary-item.new .sum-value { color: var(--color-success); }
.summary-item.dup .sum-value { color: var(--color-muted); }

.summary-actions {
  margin-left: auto;
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-round);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
}

.action-btn.ghost {
  background: var(--color-bg);
  color: var(--color-muted);
  box-shadow: var(--shadow-sm);
}

.action-btn.primary {
  background: var(--color-peach);
  color: var(--color-caramel);
  box-shadow: var(--shadow-md);
}

.action-btn:hover { transform: scale(1.03); }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* ── Error ── */
.error-list {
  background: #FFF5F5;
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-md);
}

.error-item {
  font-size: 13px;
  color: #C08080;
  margin: 4px 0;
}

/* ── Preview Table ── */
.preview-table-wrap {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: auto;
  max-height: 520px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.preview-table th {
  background: #FAF7F2;
  color: var(--color-muted);
  font-weight: 600;
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #F0EAE2;
}

.preview-table td {
  padding: 10px;
  border-bottom: 1px solid #F8F5F0;
  color: var(--color-ink);
}

.preview-table tr.duplicate {
  opacity: 0.4;
  pointer-events: none;
}

.preview-table tr.selected {
  background: #FEFCF7;
}

.preview-table tr:hover:not(.duplicate) {
  background: #FDF9F2;
  cursor: pointer;
}

.source-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.source-wechat { background: #E8F4E8; color: #5A8A5A; }
.source-alipay { background: #E8EEF8; color: #5A7AAA; }

.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.type-income { background: #DDE8CF; color: #5A7A4A; }
.type-expense { background: #F7D6D6; color: #A06060; }

.amount-in { color: var(--color-success); font-weight: 700; font-family: var(--font-round); }
.amount-out { color: #C08080; font-weight: 700; font-family: var(--font-round); }

.note-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.note-text {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dup-badge {
  flex-shrink: 0;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 8px;
  background: #F0EAE2;
  color: var(--color-muted);
}

.uncat-badge {
  flex-shrink: 0;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 8px;
  background: #FDF3D0;
  color: #B89860;
}

.cat-select {
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid #E8E0D8;
  background: var(--color-surface);
  font-size: 12px;
  color: var(--color-ink);
  max-width: 100px;
}

.muted { color: var(--color-muted); }
</style>

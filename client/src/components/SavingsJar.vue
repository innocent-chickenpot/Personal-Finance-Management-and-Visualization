<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { depositSavingsJar, deleteSavingsJar } from '@/api/savingsJars'
import DogMascot from '@/components/DogMascot.vue'

const props = defineProps({
  jar: { type: Object, required: true }
})
const emit = defineEmits(['updated', 'deleted'])

const depositVisible = ref(false)
const depositAmount = ref('')
const depositing = ref(false)

const percent = computed(() => {
  const p = (Number(props.jar.savedAmount) / Number(props.jar.targetAmount)) * 100
  return Math.min(Math.round(p * 10) / 10, 100)
})

const isFull = computed(() => percent.value >= 100)

async function handleDeposit() {
  const amt = Number(depositAmount.value)
  if (!amt || amt <= 0) {
    ElMessage.warning('请输入有效金额')
    return
  }
  depositing.value = true
  try {
    const res = await depositSavingsJar(props.jar.id, { amount: amt })
    if (res.code === 200) {
      ElMessage.success(`向「${props.jar.name}」存入了 ¥${amt.toFixed(2)}`)
      emit('updated', res.data)
      depositVisible.value = false
      depositAmount.value = ''
    }
  } catch (err) {
    ElMessage.error('存入失败')
  } finally {
    depositing.value = false
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${props.jar.name}」吗？已存金额将不会退回。`,
      '删除储蓄罐',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    const res = await deleteSavingsJar(props.jar.id)
    if (res.code === 200) {
      ElMessage.success('储蓄罐已删除')
      emit('deleted', props.jar.id)
    }
  } catch {}
}
</script>

<template>
  <div class="jar-card" :class="{ full: isFull }">
    <!-- Dog on top -->
    <div class="jar-dog">
      <DogMascot :size="60" :pose="isFull ? 'happy' : 'sitting'" />
    </div>

    <!-- Jar body -->
    <div class="jar-body">
      <!-- Glass lid -->
      <div class="jar-lid"></div>
      <!-- Neck -->
      <div class="jar-neck"></div>
      <!-- Glass container -->
      <div class="jar-glass">
        <!-- Coins fill -->
        <div class="jar-fill" :style="{ height: percent + '%' }">
          <div class="coins">
            <span v-for="i in 12" :key="i" class="coin" :style="{ left: ((i % 4) * 22 + Math.random() * 8) + '%', bottom: (i * 10) + '%' }">💰</span>
          </div>
        </div>
        <!-- Glass reflection -->
        <div class="jar-shine"></div>
      </div>
      <!-- Base -->
      <div class="jar-base"></div>
    </div>

    <!-- Label -->
    <div class="jar-label" @click="depositVisible = true">
      <p class="jar-name">{{ jar.name }}</p>
      <p class="jar-amounts">¥{{ Number(jar.savedAmount).toLocaleString() }} / ¥{{ Number(jar.targetAmount).toLocaleString() }}</p>
      <div class="jar-progress-bar">
        <div class="jar-progress-fill" :style="{ width: percent + '%' }"></div>
      </div>
      <p class="jar-percent">{{ percent }}%</p>
    </div>

    <!-- Hover layer: deposit action -->
    <div class="jar-actions">
      <button class="deposit-btn" @click="depositVisible = true">💰 存入</button>
      <button class="delete-btn" @click="handleDelete">🗑</button>
    </div>

    <!-- Deposit dialog overlay -->
    <Teleport to="body">
      <div v-if="depositVisible" class="deposit-overlay" @click.self="depositVisible = false">
        <div class="deposit-modal">
          <DogMascot :size="70" pose="peeking" />
          <h3>存入「{{ jar.name }}」</h3>
          <p class="deposit-hint">当前已存 ¥{{ Number(jar.savedAmount).toLocaleString() }} / ¥{{ Number(jar.targetAmount).toLocaleString() }}</p>
          <input
            v-model="depositAmount"
            type="number"
            class="deposit-input"
            placeholder="输入金额"
            min="0.01"
            step="0.01"
            @keyup.enter="handleDeposit"
          />
          <div class="deposit-btns">
            <button class="confirm-btn" :disabled="depositing" @click="handleDeposit">
              {{ depositing ? '存入中...' : '确认存入' }}
            </button>
            <button class="cancel-btn" @click="depositVisible = false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.jar-card {
  position: relative;
  width: 150px;
  min-width: 150px;
  text-align: center;
  padding-top: 24px;
  flex-shrink: 0;
}

/* ── Dog on top ── */
.jar-dog {
  position: relative;
  z-index: 2;
  margin-bottom: -8px;
}

/* ── Jar Body ── */
.jar-body {
  position: relative;
}

.jar-lid {
  width: 60px;
  height: 14px;
  margin: 0 auto;
  background: linear-gradient(135deg, #E8D5C0, #D4C0A8);
  border-radius: 4px 4px 0 0;
  box-shadow: 0 2px 4px rgba(139, 107, 82, 0.15);
}

.jar-neck {
  width: 70px;
  height: 8px;
  margin: 0 auto;
  background: linear-gradient(180deg, #D4C0A8, #E8D8C8);
}

.jar-glass {
  position: relative;
  width: 110px;
  height: 130px;
  margin: 0 auto;
  background: linear-gradient(
    135deg,
    rgba(255, 253, 249, 0.7),
    rgba(240, 235, 225, 0.5),
    rgba(255, 253, 249, 0.7)
  );
  border: 2px solid rgba(212, 192, 168, 0.5);
  border-radius: 0 0 20px 20px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.3);
}

.jar-shine {
  position: absolute;
  top: 8px;
  left: 10px;
  width: 16px;
  height: 40px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.6),
    rgba(255, 255, 255, 0)
  );
  border-radius: 8px;
  pointer-events: none;
}

.jar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, #F7E8B0, #EDD890);
  transition: height 0.6s var(--ease-gentle);
  overflow: hidden;
}

.coins {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 130px;
}

.coin {
  position: absolute;
  font-size: 12px;
  opacity: 0.7;
}

.jar-base {
  width: 120px;
  height: 10px;
  margin: 0 auto;
  background: linear-gradient(180deg, #D4C0A8, #C4B098);
  border-radius: 0 0 8px 8px;
  box-shadow: 0 3px 8px rgba(139, 107, 82, 0.15);
}

/* ── Label ── */
.jar-label {
  cursor: pointer;
  padding: var(--space-sm) var(--space-xs);
}

.jar-name {
  font-family: var(--font-round);
  font-size: 14px;
  color: var(--color-ink);
  font-weight: 600;
  margin-bottom: 2px;
}

.jar-amounts {
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 4px;
}

.jar-progress-bar {
  width: 100%;
  height: 4px;
  background: #F0EAE2;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 2px;
}

.jar-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-gold), #E8C870);
  border-radius: 2px;
  transition: width 0.6s var(--ease-gentle);
}

.jar-percent {
  font-family: var(--font-round);
  font-size: 12px;
  color: var(--color-caramel);
  font-weight: 600;
}

/* ── Actions ── */
.jar-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity var(--duration-normal) var(--ease-gentle);
  pointer-events: none;
}

.jar-card:hover .jar-actions {
  opacity: 1;
  pointer-events: auto;
}

.deposit-btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-peach);
  color: var(--color-caramel);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  font-family: var(--font-round);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal) var(--ease-gentle);
}

.deposit-btn:hover {
  transform: scale(1.05);
}

.delete-btn {
  padding: 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: #FDF0F0;
  color: #A06060;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
}

.delete-btn:hover {
  background: #F8E0E0;
}

/* ── Full state ── */
.jar-card.full .jar-fill {
  background: linear-gradient(180deg, #F7E8B0, #F0D868);
}

.jar-card.full .jar-glass {
  border-color: #E8C870;
}

/* ── Deposit Modal ── */
.deposit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(93, 78, 55, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.deposit-modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  text-align: center;
  width: 340px;
  box-shadow: var(--shadow-lg);
}

.deposit-modal h3 {
  font-size: 20px;
  margin: var(--space-sm) 0;
}

.deposit-hint {
  font-size: 13px;
  color: var(--color-muted);
  margin-bottom: var(--space-md);
}

.deposit-input {
  width: 100%;
  height: 48px;
  padding: 0 var(--space-md);
  font-size: 20px;
  font-family: var(--font-round);
  color: var(--color-ink);
  background: var(--color-bg);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 1px #E8E0D8;
  outline: none;
  text-align: center;
  transition: all var(--duration-normal) var(--ease-gentle);
  margin-bottom: var(--space-md);
}

.deposit-input:focus {
  box-shadow: 0 0 0 2px rgba(247, 214, 214, 0.6);
}

.deposit-btns {
  display: flex;
  gap: var(--space-sm);
}

.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-peach);
  color: var(--color-caramel);
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-round);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
}

.confirm-btn:hover:not(:disabled) {
  transform: scale(1.03);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: var(--radius-lg);
  background: #F5F0EA;
  color: var(--color-ink);
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-round);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
}

@media (prefers-reduced-motion: reduce) {
  .jar-fill, .jar-progress-fill {
    transition: none;
  }
}
</style>

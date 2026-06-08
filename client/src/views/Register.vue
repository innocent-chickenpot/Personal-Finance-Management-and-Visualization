<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register as registerApi } from '@/api/auth'
import DogMascot from '@/components/DogMascot.vue'

const router = useRouter()
const form = ref({ email: '', password: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  if (!form.value.email || !form.value.password) {
    error.value = '请填写邮箱和密码'
    return
  }
  if (form.value.password.length < 6) {
    error.value = '密码至少6位'
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    error.value = '两次密码输入不一致'
    return
  }
  loading.value = true
  try {
    const res = await registerApi({ email: form.value.email, password: form.value.password })
    if (res.code === 200) {
      localStorage.setItem('token', res.data.token)
      router.push('/')
    }
  } catch (err) {
    error.value = err.response?.data?.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-mascot">
        <DogMascot :size="140" pose="sitting" />
      </div>
      <h2 class="auth-title">创建账号</h2>
      <p class="auth-subtitle">一起来记账吧</p>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="field-group">
          <label class="field-label">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            class="field-input"
            placeholder="hello@example.com"
            autocomplete="email"
          />
        </div>
        <div class="field-group">
          <label class="field-label">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="field-input"
            placeholder="至少6位密码"
            autocomplete="new-password"
          />
        </div>
        <div class="field-group">
          <label class="field-label">确认密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="field-input"
            placeholder="再次输入密码"
            autocomplete="new-password"
          />
        </div>

        <div v-if="error" class="auth-error">{{ error }}</div>

        <button type="submit" class="auth-btn" :disabled="loading">
          <span v-if="loading" class="btn-loading"></span>
          <span v-else>注册</span>
        </button>
      </form>

      <p class="auth-link">
        已有账号？<router-link to="/login">去登录</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  padding: var(--space-lg);
}

.auth-card {
  width: 420px;
  padding: var(--space-2xl) var(--space-xl);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.auth-mascot {
  margin-bottom: var(--space-md);
}

.auth-title {
  font-size: 28px;
  color: var(--color-ink);
  margin-bottom: var(--space-xs);
}

.auth-subtitle {
  font-size: 15px;
  color: var(--color-muted);
  margin-bottom: var(--space-xl);
}

.auth-form {
  text-align: left;
}

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

.field-input {
  width: 100%;
  height: 48px;
  padding: 0 var(--space-md);
  font-size: 15px;
  color: var(--color-ink);
  background: var(--color-surface);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 1px #E8E0D8;
  outline: none;
  transition: all var(--duration-normal) var(--ease-gentle);
  font-family: var(--font-body);
}

.field-input::placeholder {
  color: #B8A898;
}

.field-input:focus {
  box-shadow: 0 0 0 2px rgba(247, 214, 214, 0.6);
}

.auth-error {
  padding: 10px var(--space-md);
  margin-bottom: var(--space-md);
  background: #FDF0F0;
  color: #A06060;
  border-radius: var(--radius-sm);
  font-size: 14px;
}

.auth-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-peach);
  color: var(--color-caramel);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
  font-family: var(--font-round);
  letter-spacing: 0.04em;
}

.auth-btn:hover:not(:disabled) {
  transform: scale(1.03);
  box-shadow: var(--shadow-float);
  background: #F0C4C4;
}

.auth-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: var(--color-caramel);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-link {
  margin-top: var(--space-lg);
  font-size: 14px;
  color: var(--color-muted);
}

.auth-link a {
  color: var(--color-caramel);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .auth-btn { transition: none; }
  .auth-btn:hover { transform: none; }
  .btn-loading { animation: none; }
}
</style>

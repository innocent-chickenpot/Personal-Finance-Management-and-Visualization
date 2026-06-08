<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import DogMascot from '@/components/DogMascot.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  await auth.fetchUser()
  if (auth.user && (route.path === '/login' || route.path === '/register')) {
    router.push('/')
  }
})

function logout() {
  localStorage.removeItem('token')
  auth.user = null
  router.push('/login')
}
</script>

<template>
  <div id="app-container" :class="{ 'has-sidebar': auth.user }">
    <!-- Sidebar (authenticated only) -->
    <aside v-if="auth.user" class="sidebar">
      <div class="sidebar-inner">
        <div class="sidebar-top">
          <!-- Logo: hand-drawn house + dog -->
          <router-link to="/" class="sidebar-logo">
            <svg class="logo-house" width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- house body -->
              <rect x="8" y="20" width="32" height="24" rx="3" fill="#FDF5EC" stroke="#D4C0A8" stroke-width="2"/>
              <!-- roof -->
              <path d="M4 22 L24 4 L44 22" fill="#FDF5EC" stroke="#D4C0A8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- chimney -->
              <rect x="30" y="6" width="8" height="14" rx="2" fill="#FDF5EC" stroke="#D4C0A8" stroke-width="2"/>
              <!-- door -->
              <rect x="18" y="30" width="12" height="14" rx="2" fill="#FDF5EC" stroke="#C4B098" stroke-width="1.8"/>
              <circle cx="28" cy="38" r="1.5" fill="#C4B098"/>
              <!-- window left -->
              <rect x="11" y="26" width="8" height="7" rx="1.5" fill="#FFFDF9" stroke="#D8E7F5" stroke-width="1.5"/>
              <line x1="15" y1="26" x2="15" y2="33" stroke="#D8E7F5" stroke-width="1"/>
              <line x1="11" y1="29.5" x2="19" y2="29.5" stroke="#D8E7F5" stroke-width="1"/>
              <!-- window right -->
              <rect x="29" y="26" width="8" height="7" rx="1.5" fill="#FFFDF9" stroke="#D8E7F5" stroke-width="1.5"/>
              <line x1="33" y1="26" x2="33" y2="33" stroke="#D8E7F5" stroke-width="1"/>
              <line x1="29" y1="29.5" x2="37" y2="29.5" stroke="#D8E7F5" stroke-width="1"/>
              <!-- little dog sitting by the house -->
              <circle cx="10" cy="38" r="5" fill="#F5E6D8"/>
              <ellipse cx="7" cy="33" rx="3" ry="5" fill="#E0C4A8"/>
              <ellipse cx="13" cy="33" rx="3" ry="5" fill="#E0C4A8"/>
              <circle cx="8" cy="37" r="1.5" fill="#4A3525"/>
              <circle cx="12" cy="37" r="1.5" fill="#4A3525"/>
              <ellipse cx="10" cy="40" rx="2.5" ry="1.5" fill="#F2C4C4"/>
            </svg>
            <div class="logo-text-group">
              <span class="logo-title">奶油财务小屋</span>
              <span class="logo-slogan">记录每一份认真生活</span>
            </div>
          </router-link>

          <nav class="sidebar-nav">
            <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
              <svg class="nav-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span class="nav-label">首页</span>
            </router-link>
            <router-link to="/transactions" class="nav-item" :class="{ active: $route.path.startsWith('/transactions') }">
              <svg class="nav-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>
              <span class="nav-label">账单记录</span>
            </router-link>
            <router-link to="/transactions/new" class="nav-item" :class="{ active: $route.path === '/transactions/new' }">
              <svg class="nav-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span class="nav-label">记录一笔</span>
            </router-link>
          </nav>
        </div>

        <div class="sidebar-bottom">
          <!-- Tips module -->
          <div class="tips-card">
            <svg class="tips-paperclip" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4B098" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a4 4 0 0 0 8 0V4a2 2 0 0 0-4 0v12a1 1 0 0 0 2 0V6"/></svg>
            <div class="tips-header">
              <span class="tips-icon">💡</span>
              <span class="tips-title">小贴士</span>
            </div>
            <p class="tips-text">每日记账，让每一笔钱都有意义~</p>
          </div>

          <div class="sidebar-user">
            <div class="user-avatar">{{ auth.user?.email?.charAt(0).toUpperCase() }}</div>
            <span class="user-email">{{ auth.user?.email }}</span>
          </div>
          <button class="logout-btn" @click="logout">退出登录</button>
          <div class="sidebar-mascot">
            <DogMascot :size="80" pose="sitting" />
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main :class="auth.user ? 'main-content' : 'main-full'">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
/* ── Layout ── */
#app-container {
  display: flex;
  min-height: 100vh;
}

/* ── Sidebar ── */
.sidebar {
  width: 200px;
  height: 100vh;
  position: sticky;
  top: 0;
  left: 0;
  flex-shrink: 0;
  z-index: 100;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 20px 12px;
  background: var(--color-surface);
  border-right: 1px solid #F0EAE2;
  border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
  box-shadow: var(--shadow-md);
}

/* ── Logo ── */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 12px;
  margin-bottom: 8px;
  text-decoration: none;
  border-bottom: 1px dashed #E8E0D8;
}

.logo-house {
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(139, 107, 82, 0.10));
}

.logo-text-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.logo-title {
  font-family: var(--font-round);
  font-size: 16px;
  color: var(--color-ink);
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
}

.logo-slogan {
  font-size: 11px;
  color: var(--color-muted);
  font-weight: 400;
  white-space: nowrap;
}

/* ── Nav ── */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-ink);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--duration-normal) var(--ease-gentle);
}

.nav-item:hover {
  background: #F5F0EA;
}

.nav-item.active {
  background: var(--color-peach);
  color: var(--color-caramel);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.nav-svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

/* ── Sidebar Bottom ── */
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ── Tips Card ── */
.tips-card {
  position: relative;
  background: #FDF9ED;
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 8px;
  box-shadow: 0 1px 6px rgba(139, 107, 82, 0.05);
}

.tips-paperclip {
  position: absolute;
  top: -6px;
  right: 16px;
  transform: rotate(12deg);
  opacity: 0.6;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.tips-icon {
  font-size: 14px;
}

.tips-title {
  font-family: var(--font-round);
  font-size: 13px;
  color: var(--color-caramel);
  font-weight: 600;
}

.tips-text {
  font-size: 12px;
  color: var(--color-muted);
  line-height: 1.5;
  margin: 0;
}

/* ── User ── */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 6px 12px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-peach);
  color: var(--color-caramel);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.user-email {
  font-size: 12px;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  width: 100%;
  padding: 7px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-gentle);
  font-family: var(--font-body);
  text-align: center;
}

.logout-btn:hover {
  background: #FDF0F0;
  color: #C08080;
}

.sidebar-mascot {
  display: flex;
  justify-content: center;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed #E8E0D8;
}

/* ── Main Content ── */
.main-content {
  flex: 1;
  padding: var(--space-lg) var(--space-xl);
  overflow-x: hidden;
}

.main-full {
  flex: 1;
}

@media (prefers-reduced-motion: reduce) {
  .nav-item, .logout-btn {
    transition: none;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }
  .sidebar-inner {
    padding: 16px 8px;
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
  }
  .sidebar-logo {
    justify-content: center;
    padding: 4px 0 10px;
    border-bottom: 1px dashed #E8E0D8;
  }
  .logo-text-group { display: none; }
  .logo-house { width: 32px; height: 32px; }
  .nav-item {
    justify-content: center;
    padding: 10px;
  }
  .nav-label { display: none; }
  .nav-svg { width: 20px; height: 20px; }
  .tips-card { display: none; }
  .sidebar-user { display: none; }
  .logout-btn { font-size: 11px; }
  .sidebar-mascot { display: none; }
  .main-content {
    padding: var(--space-md);
  }
}
</style>

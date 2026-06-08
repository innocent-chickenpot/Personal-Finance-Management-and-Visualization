import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('@/views/Transactions.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions/new',
    name: 'TransactionNew',
    component: () => import('@/views/TransactionForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions/:id',
    name: 'TransactionEdit',
    component: () => import('@/views/TransactionForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/import',
    name: 'ImportBill',
    component: () => import('@/views/ImportBill.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings/mappings',
    name: 'CategoryMappings',
    component: () => import('@/views/CategoryMappings.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.guest && token) {
    next('/')
  } else {
    next()
  }
})

export default router

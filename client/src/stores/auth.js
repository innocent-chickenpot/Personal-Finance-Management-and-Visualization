import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMe } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  async function fetchUser() {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await getMe()
      if (res.code === 200) {
        user.value = res.data
      }
    } catch {
      localStorage.removeItem('token')
    }
  }

  return { user, fetchUser }
})

import { defineStore } from 'pinia'
import { api } from '@/api/client.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('auth_token') || null,
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
  },
  actions: {
    async login({ email, password }) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/api/auth/login', { email, password })
        this.token = data.token
        this.user = data.user
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_user', JSON.stringify(data.user))
        return true
      } catch (e) {
        this.error = e?.response?.data?.error || 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    },
    async fetchMe() {
      if (!this.token) return null
      try {
        const { data } = await api.get('/api/auth/me')
        this.user = data
        return data
      } catch (_e) {
        this.logout()
        return null
      }
    },
  },
})

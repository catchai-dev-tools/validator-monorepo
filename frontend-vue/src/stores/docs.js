import { defineStore } from 'pinia'
import { api } from '@/api/client.js'

export const useDocsStore = defineStore('docs', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/api/document-types')
        this.items = Array.isArray(data) ? data : []
      } catch (e) {
        this.error = e?.response?.data?.error || 'Failed to load document types'
      } finally {
        this.loading = false
      }
    },
  },
})

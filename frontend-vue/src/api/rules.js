import { api } from '@/api/client.js'

export const RulesApi = {
  list: (params = {}) => api.get('/api/rules', { params }),
  get: (id) => api.get(`/api/rules/${id}`),
  create: (payload) => api.post('/api/rules', payload),
  update: (id, payload) => api.put(`/api/rules/${id}`, payload),
  remove: (id) => api.delete(`/api/rules/${id}`),
}

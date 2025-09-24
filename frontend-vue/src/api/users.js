import { api } from '@/api/client.js'

export const UsersApi = {
  list: () => api.get('/api/users'),
  get: (id) => api.get(`/api/users/${id}`),
  create: (payload) => api.post('/api/users', payload),
  update: (id, payload) => api.put(`/api/users/${id}`, payload),
  remove: (id) => api.delete(`/api/users/${id}`),
}

import { api } from '@/api/client.js'

export const DocumentTypesApi = {
  list: () => api.get('/api/document-types'),
  get: (id) => api.get(`/api/document-types/${id}`),
  create: (payload) => api.post('/api/document-types', payload),
  update: (id, payload) => api.put(`/api/document-types/${id}`, payload),
  complete: (id) => api.patch(`/api/document-types/${id}/complete`),
  remove: (id) => api.delete(`/api/document-types/${id}`),
}

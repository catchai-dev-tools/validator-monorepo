import { api } from '@/api/client.js'

export const ValidationRunsApi = {
  list: (params = {}) => api.get('/api/validation-runs', { params }),
  get: (id) => api.get(`/api/validation-runs/${id}`),
  create: (payload) => api.post('/api/validation-runs', payload),
  updateStatus: (id, status, summary, reports = {}) =>
    api.patch(`/api/validation-runs/${id}/status`, { status, summary, ...reports }),
  updateState: (id, state) => api.patch(`/api/validation-runs/${id}/state`, { state }),
  accept: (id) => api.post(`/api/validation-runs/${id}/accept`),
  remove: (id) => api.delete(`/api/validation-runs/${id}`),
  stats: () => api.get('/api/validation-runs/stats'),
  draftCleanup: (daysOld = 30) => api.get('/api/validation-runs/cleanup/drafts', { params: { daysOld } }),
}

import { api } from '@/api/client.js'

export const RuleSetsApi = {
  list: () => api.get('/api/rule-sets'),
  get: (id) => api.get(`/api/rule-sets/${id}`),
  listByDocumentType: (documentTypeId) => api.get(`/api/document-types/${documentTypeId}/rule-sets`),
  latestByDocumentType: (documentTypeId) => api.get(`/api/document-types/${documentTypeId}/rule-sets/latest`),
  create: (payload) => api.post('/api/rule-sets', payload),
  update: (id, payload) => api.put(`/api/rule-sets/${id}`, payload),
  addRules: (id, ruleIds) => api.post(`/api/rule-sets/${id}/rules`, { ruleIds }),
  removeRules: (id, ruleIds) => api.delete(`/api/rule-sets/${id}/rules`, { data: { ruleIds } }),
  remove: (id) => api.delete(`/api/rule-sets/${id}`),
}

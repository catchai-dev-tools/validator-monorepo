import { api } from '@/api/client.js'

export const BulkFilesApi = {
  list: () => api.get('/api/bulk-files'),
  listByDocumentType: (documentTypeId) => api.get(`/api/document-types/${documentTypeId}/bulk-files`),
  get: (id) => api.get(`/api/bulk-files/${id}`),
  create: (payload) => api.post('/api/bulk-files', payload),
  update: (id, payload) => api.put(`/api/bulk-files/${id}`, payload),
  updateIngestionStatus: (id, status, summary) => api.patch(`/api/bulk-files/${id}/ingestion-status`, { status, summary }),
  remove: (id) => api.delete(`/api/bulk-files/${id}`),
}

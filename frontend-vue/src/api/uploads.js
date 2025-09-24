import { api } from '@/api/client.js'

export const UploadsApi = {
  uploadFile: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

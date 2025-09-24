<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import CardBox from '@/components/CardBox.vue'
import BaseButton from '@/components/BaseButton.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import { UploadsApi } from '@/api/uploads.js'
import { BulkFilesApi } from '@/api/bulkFiles.js'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)

const file = ref(null)
const uploading = ref(false)
const creating = ref(false)
const uploadedUrl = ref('')
const originalFileName = ref('')

async function onFileChange(e) {
  const f = e.target.files?.[0]
  file.value = f || null
  uploadedUrl.value = ''
  if (f) {
    originalFileName.value = f.name
  }
}

async function upload() {
  if (!file.value) return
  uploading.value = true
  try {
    const { data } = await UploadsApi.uploadFile(file.value)
    uploadedUrl.value = data?.url || ''
  } catch (e) {
    alert(e?.response?.data?.error || 'Upload failed')
  } finally {
    uploading.value = false
  }
}

async function createBulkFile() {
  if (!id.value) return
  if (!uploadedUrl.value) return alert('Please upload a file first')
  creating.value = true
  try {
    await BulkFilesApi.create({
      originalFileName: originalFileName.value || 'uploaded-file',
      rawFileUrl: uploadedUrl.value,
      documentTypeId: id.value,
    })
    router.push(`/docs/${id.value}/bulk-files`)
  } catch (e) {
    alert(e?.response?.data?.error || 'Failed to create bulk file')
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" title="New Bulk File" />
      <CardBox>
        <div class="space-y-4">
          <FormField label="File">
            <input type="file" @change="onFileChange" />
          </FormField>
          <div class="flex gap-2 items-center">
            <BaseButton :disabled="!file || uploading" color="info" :label="uploading ? 'Uploading…' : 'Upload'" @click="upload" />
            <span v-if="uploadedUrl" class="text-sm text-green-700">Uploaded to {{ uploadedUrl }}</span>
          </div>
          <div>
            <BaseButton :disabled="!uploadedUrl || creating" color="success" :label="creating ? 'Creating…' : 'Create Bulk File'" @click="createBulkFile" />
            <BaseButton :to="`/docs/${id}/bulk-files`" color="info" outline label="Cancel" class="ml-2" />
          </div>
        </div>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>

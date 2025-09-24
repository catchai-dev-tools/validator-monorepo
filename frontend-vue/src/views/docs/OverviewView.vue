<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api/client.js'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import CardBox from '@/components/CardBox.vue'
import BaseButton from '@/components/BaseButton.vue'
import { DocumentTypesApi } from '@/api/documentTypes.js'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)
const loading = ref(false)
const docType = ref(null)
const hasData = ref(false)
const completing = ref(false)

async function fetchDocType() {
  if (!id.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/api/document-types/${id.value}`)
    docType.value = data
    // Check whether any bulk files exist for this document type to lock ingestion edits
    const bf = await api.get(`/api/document-types/${id.value}/bulk-files`)
    hasData.value = Array.isArray(bf.data) && bf.data.length > 0
  } finally {
    loading.value = false
  }
}

onMounted(fetchDocType)

async function completeDoc() {
  if (!id.value) return
  completing.value = true
  try {
    await DocumentTypesApi.complete(id.value)
    await fetchDocType()
  } catch (e) {
    alert(e?.response?.data?.error || 'Failed to complete document type')
  } finally {
    completing.value = false
  }
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" :title="docType ? `${docType.name} — Overview` : 'Overview'" />
      <div class="mb-3 flex gap-2">
        <BaseButton color="info" label="Edit details" @click="router.push(`/docs/${id}/edit-details`)" />
        <BaseButton
          :disabled="hasData"
          :title="hasData ? 'Ingestion is locked because data has been ingested' : ''"
          color="warning"
          outline
          label="Edit ingestion"
          @click="router.push(`/docs/${id}/edit-ingestion`)"
        />
        <BaseButton
          v-if="docType?.status !== 'completed'"
          :disabled="completing"
          color="success"
          :label="completing ? 'Completing…' : 'Complete'"
          @click="completeDoc"
        />
        <BaseButton
          v-if="docType?.status === 'completed'"
          color="info"
          outline
          label="New Bulk File"
          @click="router.push(`/docs/${id}/bulk-files/new`)"
        />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardBox>
          <div class="text-gray-500 text-sm">Status</div>
          <div class="text-2xl">{{ docType?.status || '-' }}</div>
        </CardBox>
        <CardBox>
          <div class="text-gray-500 text-sm">Description</div>
          <div>{{ docType?.description || 'No description.' }}</div>
        </CardBox>
        <CardBox>
          <div class="text-gray-500 text-sm">Created</div>
          <div>{{ docType?.createdAt ? new Date(docType.createdAt).toLocaleString() : '-' }}</div>
          <div class="text-gray-500 text-sm mt-2">Doc ID</div>
          <div class="font-mono text-xs break-all">{{ docType?.id }}</div>
        </CardBox>
      </div>

      <CardBox class="mt-4">
        <div class="text-gray-500 text-sm mb-2">Ingestion Config</div>
        <pre class="bg-gray-50 p-3 rounded overflow-auto text-xs">{{ JSON.stringify(docType?.ingestionConfig || {}, null, 2) }}</pre>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>

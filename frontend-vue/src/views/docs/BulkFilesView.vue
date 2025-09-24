<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client.js'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import CardBox from '@/components/CardBox.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'

const route = useRoute()
const id = computed(() => route.params.id)
const loading = ref(false)
const rows = ref([])

async function fetchBulkFiles() {
  if (!id.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/api/document-types/${id.value}/bulk-files`)
    rows.value = data || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchBulkFiles)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" title="Bulk Files" />
      <CardBox>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead>
              <tr class="text-gray-500">
                <th class="px-3 py-2">File</th>
                <th class="px-3 py-2">Ingestion</th>
                <th class="px-3 py-2">Uploaded</th>
                <th class="px-3 py-2">Clean URL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id" class="border-t">
                <td class="px-3 py-2">{{ r.originalFileName }}</td>
                <td class="px-3 py-2">{{ r.ingestionStatus }}</td>
                <td class="px-3 py-2">{{ new Date(r.uploadedAt).toLocaleString() }}</td>
                <td class="px-3 py-2"><a :href="r.cleanFileUrl" class="text-blue-600" target="_blank">{{ r.cleanFileUrl || '-' }}</a></td>
              </tr>
              <tr v-if="!loading && rows.length === 0">
                <td colspan="4" class="px-3 py-6 text-center text-gray-500">No bulk files</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>

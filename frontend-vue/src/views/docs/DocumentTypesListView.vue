<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/api/client.js'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import CardBox from '@/components/CardBox.vue'
import BaseButton from '@/components/BaseButton.vue'
import { useRouter } from 'vue-router'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'

const loading = ref(false)
const rows = ref([])
const router = useRouter()

async function fetchDocumentTypes() {
  loading.value = true
  try {
    const { data } = await api.get('/api/document-types')
    rows.value = data || []
  } finally {
    loading.value = false
  }
}

function goTo(dt, sub = 'overview') {
  router.push(`/docs/${dt.id}/${sub}`)
}

onMounted(fetchDocumentTypes)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" title="Document Types">
        <template #right>
          <BaseButton color="info" label="New" @click="router.push('/docs/new')" />
        </template>
      </SectionTitleLineWithButton>
      <CardBox>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead>
              <tr class="text-gray-500">
                <th class="px-3 py-2">Name</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2">Created</th>
                <th class="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dt in rows" :key="dt.id" class="border-t">
                <td class="px-3 py-2">{{ dt.name }}</td>
                <td class="px-3 py-2">{{ dt.status }}</td>
                <td class="px-3 py-2">{{ dt.createdAt ? new Date(dt.createdAt).toLocaleString() : '-' }}</td>
                <td class="px-3 py-2">
                  <BaseButton size="sm" color="info" label="Overview" @click="goTo(dt, 'overview')" />
                  <BaseButton size="sm" color="info" outline class="ml-2" label="Rule Sets" @click="goTo(dt, 'rule-sets')" />
                  <BaseButton size="sm" color="info" outline class="ml-2" label="Bulk Files" @click="goTo(dt, 'bulk-files')" />
                  <BaseButton size="sm" color="info" outline class="ml-2" label="Runs" @click="goTo(dt, 'runs')" />
                </td>
              </tr>
              <tr v-if="!loading && rows.length === 0">
                <td colspan="4" class="px-3 py-6 text-center text-gray-500">No document types</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>

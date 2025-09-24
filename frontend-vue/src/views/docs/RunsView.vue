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

async function fetchRuns() {
  if (!id.value) return
  loading.value = true
  try {
    const { data } = await api.get('/api/validation-runs')
    rows.value = (data || []).filter((r) => r?.bulkFile?.documentType?.id === id.value)
  } finally {
    loading.value = false
  }
}

onMounted(fetchRuns)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" title="Validation Runs" />
      <CardBox>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead>
              <tr class="text-gray-500">
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2">State</th>
                <th class="px-3 py-2">Bulk File</th>
                <th class="px-3 py-2">Rule Set</th>
                <th class="px-3 py-2">Submitted</th>
                <th class="px-3 py-2">Completed</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id" class="border-t">
                <td class="px-3 py-2">{{ r.status }}</td>
                <td class="px-3 py-2">{{ r.state }}</td>
                <td class="px-3 py-2">{{ r.bulkFile?.originalFileName }}</td>
                <td class="px-3 py-2">{{ r.ruleSet ? `v${r.ruleSet.version}` : '' }}</td>
                <td class="px-3 py-2">{{ new Date(r.submittedAt).toLocaleString() }}</td>
                <td class="px-3 py-2">{{ r.completedAt ? new Date(r.completedAt).toLocaleString() : '-' }}</td>
              </tr>
              <tr v-if="!loading && rows.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-gray-500">No runs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>

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

async function fetchRuleSets() {
  if (!id.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/api/document-types/${id.value}/rule-sets`)
    rows.value = data || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchRuleSets)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" title="Rule Sets" />
      <CardBox>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead>
              <tr class="text-gray-500">
                <th class="px-3 py-2">Version</th>
                <th class="px-3 py-2">Description</th>
                <th class="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id" class="border-t">
                <td class="px-3 py-2">v{{ r.version }}</td>
                <td class="px-3 py-2">{{ r.description || '-' }}</td>
                <td class="px-3 py-2">{{ new Date(r.createdAt).toLocaleString() }}</td>
              </tr>
              <tr v-if="!loading && rows.length === 0">
                <td colspan="3" class="px-3 py-6 text-center text-gray-500">No rule sets</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/api/client.js'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import CardBox from '@/components/CardBox.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'

const loading = ref(false)
const rows = ref([])

async function fetchUsers() {
  loading.value = true
  try {
    const { data } = await api.get('/api/users')
    rows.value = data || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" title="Users" />
      <CardBox>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead>
              <tr class="text-gray-500">
                <th class="px-3 py-2">Email</th>
                <th class="px-3 py-2">Role</th>
                <th class="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id" class="border-t">
                <td class="px-3 py-2">{{ r.email }}</td>
                <td class="px-3 py-2">{{ r.role }}</td>
                <td class="px-3 py-2">{{ new Date(r.createdAt).toLocaleString() }}</td>
              </tr>
              <tr v-if="!loading && rows.length === 0">
                <td colspan="3" class="px-3 py-6 text-center text-gray-500">No users</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>

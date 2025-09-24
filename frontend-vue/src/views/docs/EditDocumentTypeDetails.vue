<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import CardBox from '@/components/CardBox.vue'
import BaseButton from '@/components/BaseButton.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import { DocumentTypesApi } from '@/api/documentTypes.js'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)

const loading = ref(false)
const name = ref('')
const description = ref('')
const createdAt = ref('')

async function load() {
  if (!id.value) return
  loading.value = true
  try {
    const { data } = await DocumentTypesApi.get(id.value)
    name.value = data?.name || ''
    description.value = data?.description || ''
    createdAt.value = data?.createdAt || ''
  } finally {
    loading.value = false
  }
}

async function save() {
  loading.value = true
  try {
    await DocumentTypesApi.update(id.value, { name: name.value, description: description.value })
    router.push(`/docs/${id.value}/overview`)
  } catch (e) {
    alert(e?.response?.data?.error || 'Failed to update details')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" title="Edit Details" />
      <CardBox>
        <form @submit.prevent="save" class="space-y-3">
          <div class="text-sm text-gray-500">Doc ID</div>
          <div class="font-mono text-xs break-all">{{ id }}</div>
          <div class="text-sm text-gray-500 mt-2">Created</div>
          <div>{{ createdAt ? new Date(createdAt).toLocaleString() : '-' }}</div>

          <FormField label="Name">
            <FormControl v-model="name" placeholder="Document type name" />
          </FormField>
          <FormField label="Description">
            <FormControl v-model="description" placeholder="Optional description" />
          </FormField>
          <BaseButton :disabled="loading || !name" type="submit" color="info" :label="loading ? 'Saving…' : 'Save'" />
          <BaseButton :to="`/docs/${id}/overview`" color="info" outline label="Cancel" />
        </form>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>

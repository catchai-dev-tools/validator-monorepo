<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import CardBox from '@/components/CardBox.vue'
import BaseButton from '@/components/BaseButton.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import { DocumentTypesApi } from '@/api/documentTypes.js'
import { api } from '@/api/client.js'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)

const loading = ref(false)
const lock = ref(false) // true if data ingested (cannot edit)

const selectedFile = ref(null)
const sampleLines = ref([])
const maxSampleLines = 20

const fields = ref([]) // { name, type, length }
const types = ['str', 'int', 'float']
const lineLength = ref(0)

async function load() {
  if (!id.value) return
  loading.value = true
  try {
    const { data } = await DocumentTypesApi.get(id.value)
    const cfg = data?.ingestionConfig || {}
    lineLength.value = Number(cfg.lineLength || 0)
    fields.value = Array.isArray(cfg.fields)
      ? cfg.fields.map((f) => ({ name: f.name || '', type: f.type || 'str', length: Number(f.length || 0) }))
      : []
    // Lock if any bulk files
    const bf = await api.get(`/api/document-types/${id.value}/bulk-files`)
    lock.value = Array.isArray(bf.data) && bf.data.length > 0
  } finally {
    loading.value = false
  }
}

function addField() {
  fields.value.push({ name: '', type: 'str', length: 0 })
}

function removeField(idx) {
  fields.value.splice(idx, 1)
}

async function onFileChange(e) {
  const file = e.target.files?.[0]
  selectedFile.value = file || null
  sampleLines.value = []
  if (!file) return
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0).slice(0, maxSampleLines)
  sampleLines.value = lines
  lineLength.value = Math.max(...sampleLines.value.map((l) => l.length))
}

const totalFieldLength = computed(() => fields.value.reduce((sum, f) => sum + Number(f.length || 0), 0))
const lengthOk = computed(() => totalFieldLength.value === Number(lineLength.value) && Number(lineLength.value) > 0)

const samplePreview = computed(() => {
  if (!sampleLines.value.length || !fields.value.length) return []
  const starts = []
  let pos = 0
  for (const f of fields.value) {
    const len = Number(f.length || 0)
    starts.push({ start: pos, end: pos + len, name: f.name })
    pos += len
  }
  return sampleLines.value.map((line) =>
    starts.map(({ start, end, name }, idx) => ({ idx, name: name || `f${idx + 1}`, raw: line.slice(start, end) }))
  )
})

async function save() {
  if (lock.value) return
  if (!lengthOk.value) return alert('Sum of field lengths must equal line length')
  loading.value = true
  try {
    const ingestionConfig = {
      format: 'fixed-width',
      lineLength: Number(lineLength.value),
      fields: fields.value.map((f, i) => ({ index: i, name: f.name, type: f.type, length: Number(f.length) })),
      samplePreview: samplePreview.value.slice(0, 3),
    }
    await DocumentTypesApi.update(id.value, { ingestionConfig })
    router.push(`/docs/${id.value}/overview`)
  } catch (e) {
    alert(e?.response?.data?.error || 'Failed to update ingestion config')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" title="Edit Ingestion" />
      <CardBox class="mb-4" v-if="lock">
        <div class="text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
          Ingestion configuration is locked because data has been ingested for this document type.
        </div>
      </CardBox>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CardBox class="lg:col-span-1">
          <form @submit.prevent="save" class="space-y-3">
            <FormField label="Sample file (.txt)">
              <input type="file" accept=".txt,.dat,.csv" @change="onFileChange" :disabled="lock" />
              <p class="text-xs text-gray-500 mt-1">We will read up to {{ maxSampleLines }} non-empty lines client-side</p>
            </FormField>

            <FormField label="Line length">
              <FormControl v-model.number="lineLength" type="number" min="0" :disabled="lock" />
            </FormField>

            <div class="text-sm">
              <div>Sum of fields: <b :class="{ 'text-green-700': lengthOk, 'text-red-600': !lengthOk }">{{ totalFieldLength }}</b></div>
            </div>

            <div class="flex items-center justify-between mt-2">
              <div class="font-medium">Fields</div>
              <BaseButton size="sm" color="info" label="Add Field" @click.prevent="addField" :disabled="lock" />
            </div>

            <div class="space-y-2">
              <div v-for="(f, idx) in fields" :key="idx" class="grid grid-cols-12 gap-2 items-end">
                <div class="col-span-6">
                  <FormField :label="`Name #${idx+1}`">
                    <FormControl v-model="f.name" placeholder="e.g., account_id" :disabled="lock" />
                  </FormField>
                </div>
                <div class="col-span-3">
                  <FormField label="Type">
                    <select v-model="f.type" class="w-full border rounded px-3 py-2" :disabled="lock">
                      <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </FormField>
                </div>
                <div class="col-span-2">
                  <FormField label="Length">
                    <FormControl v-model.number="f.length" type="number" min="0" :disabled="lock" />
                  </FormField>
                </div>
                <div class="col-span-1 flex justify-end">
                  <BaseButton size="sm" color="danger" outline label="X" @click.prevent="removeField(idx)" :disabled="lock" />
                </div>
              </div>
            </div>

            <div class="pt-2">
              <BaseButton :disabled="lock || !lengthOk || !fields.length" color="info" label="Save" type="submit" />
              <BaseButton :to="`/docs/${id}/overview`" color="info" outline label="Cancel" />
            </div>
          </form>
        </CardBox>

        <CardBox class="lg:col-span-2">
          <div class="font-medium mb-2">Sample preview</div>
          <div v-if="!sampleLines.length" class="text-gray-500 text-sm">Upload a sample file to preview (optional)</div>
          <div v-else class="space-y-3">
            <div v-for="(row, rIdx) in samplePreview" :key="rIdx" class="overflow-auto">
              <table class="min-w-full text-left text-xs">
                <thead>
                  <tr>
                    <th class="px-2 py-1">#</th>
                    <th class="px-2 py-1">Field</th>
                    <th class="px-2 py-1">Slice</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cell in row" :key="cell.idx" class="border-t">
                    <td class="px-2 py-1">{{ cell.idx + 1 }}</td>
                    <td class="px-2 py-1">{{ cell.name }}</td>
                    <td class="px-2 py-1 font-mono">{{ cell.raw }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardBox>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>

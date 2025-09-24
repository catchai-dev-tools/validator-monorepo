<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import CardBox from '@/components/CardBox.vue'
import BaseButton from '@/components/BaseButton.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import { DocumentTypesApi } from '@/api/documentTypes.js'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'

const router = useRouter()

const name = ref('')
const description = ref('')

const selectedFile = ref(null)
const sampleLines = ref([]) // array of strings
const maxSampleLines = 20

const fields = ref([
  // { name: '', type: 'str', length: 0 }
])

const types = ['str', 'int', 'float']

const lineLength = computed(() => {
  if (!sampleLines.value.length) return 0
  return Math.max(...sampleLines.value.map((l) => l.length))
})

const totalFieldLength = computed(() => fields.value.reduce((sum, f) => sum + Number(f.length || 0), 0))
const lengthOk = computed(() => totalFieldLength.value === lineLength.value && lineLength.value > 0)

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
  // Normalize newlines and take first N non-empty lines
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0).slice(0, maxSampleLines)
  sampleLines.value = lines
}

async function submit() {
  // Basic validations
  if (!name.value) return alert('Name is required')
  if (!sampleLines.value.length) return alert('Please upload a sample file to infer line length')
  if (!fields.value.length) return alert('Please define at least one field')
  if (!lengthOk.value) return alert(`Sum of field lengths (${totalFieldLength.value}) must equal line length (${lineLength.value})`)

  const ingestionConfig = {
    format: 'fixed-width',
    lineLength: lineLength.value,
    fields: fields.value.map((f, i) => ({ index: i, name: f.name, type: f.type, length: Number(f.length) })),
    samplePreview: samplePreview.value.slice(0, 3),
  }

  try {
    await DocumentTypesApi.create({ name: name.value, description: description.value, ingestionConfig })
    alert('Document type created')
    router.push('/docs')
  } catch (e) {
    console.error(e)
    alert(e?.response?.data?.error || 'Failed to create document type')
  }
}

// Build preview: for each sample line, slice according to field lengths
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
    starts.map(({ start, end, name }, idx) => ({
      idx,
      name: name || `f${idx + 1}`,
      raw: line.slice(start, end),
    }))
  )
})
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :main="true" title="New Document Type" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CardBox class="lg:col-span-1">
          <form @submit.prevent="submit" class="space-y-3">
            <FormField label="Name">
              <FormControl v-model="name" placeholder="e.g., Bank Statement v1" />
            </FormField>
            <FormField label="Description">
              <FormControl v-model="description" placeholder="Optional description" />
            </FormField>
            <FormField label="Sample file (.txt)">
              <input type="file" accept=".txt,.dat,.csv" @change="onFileChange" />
              <p class="text-xs text-gray-500 mt-1">We will read up to {{ maxSampleLines }} non-empty lines client-side</p>
            </FormField>

            <div class="text-sm">
              <div>Detected line length: <b>{{ lineLength }}</b></div>
              <div>Sum of fields: <b :class="{ 'text-green-700': lengthOk, 'text-red-600': !lengthOk }">{{ totalFieldLength }}</b></div>
            </div>

            <div class="flex items-center justify-between mt-2">
              <div class="font-medium">Fields</div>
              <BaseButton size="sm" color="info" label="Add Field" @click.prevent="addField" />
            </div>

            <div class="space-y-2">
              <div v-for="(f, idx) in fields" :key="idx" class="grid grid-cols-12 gap-2 items-end">
                <div class="col-span-6">
                  <FormField :label="`Name #${idx+1}`">
                    <FormControl v-model="f.name" placeholder="e.g., account_id" />
                  </FormField>
                </div>
                <div class="col-span-3">
                  <FormField label="Type">
                    <select v-model="f.type" class="w-full border rounded px-3 py-2">
                      <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </FormField>
                </div>
                <div class="col-span-2">
                  <FormField label="Length">
                    <FormControl v-model.number="f.length" type="number" min="0" />
                  </FormField>
                </div>
                <div class="col-span-1 flex justify-end">
                  <BaseButton size="sm" color="danger" outline label="X" @click.prevent="removeField(idx)" />
                </div>
              </div>
            </div>

            <div class="pt-2">
              <BaseButton :disabled="!lengthOk || !name || !fields.length" color="info" label="Create" type="submit" />
            </div>
          </form>
        </CardBox>

        <CardBox class="lg:col-span-2">
          <div class="font-medium mb-2">Sample preview</div>
          <div v-if="!sampleLines.length" class="text-gray-500 text-sm">Upload a sample file to preview</div>
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

<script setup>
import { reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { mdiAccount, mdiAsterisk } from '@mdi/js'
import SectionFullScreen from '@/components/SectionFullScreen.vue'
import CardBox from '@/components/CardBox.vue'
import FormCheckRadio from '@/components/FormCheckRadio.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import LayoutGuest from '@/layouts/LayoutGuest.vue'
import { useAuthStore } from '@/stores/auth.js'

const form = reactive({
  email: '',
  password: '',
  remember: true,
})

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const submit = async () => {
  const ok = await auth.login({ email: form.email, password: form.password })
  if (ok) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.push(redirect)
  }
}
</script>

<template>
  <LayoutGuest>
    <SectionFullScreen v-slot="{ cardClass }" bg="purplePink">
      <CardBox :class="cardClass" is-form @submit.prevent="submit">
        <FormField label="Email" help="Please enter your email">
          <FormControl
            v-model="form.email"
            :icon="mdiAccount"
            name="email"
            type="email"
            autocomplete="email"
          />
        </FormField>

        <FormField label="Password" help="Please enter your password">
          <FormControl
            v-model="form.password"
            :icon="mdiAsterisk"
            type="password"
            name="password"
            autocomplete="current-password"
          />
        </FormField>

        <FormCheckRadio
          v-model="form.remember"
          name="remember"
          label="Remember"
          :input-value="true"
        />

        <template #footer>
          <BaseButtons>
            <BaseButton :disabled="auth.loading" type="submit" color="info" :label="auth.loading ? 'Signing in…' : 'Login'" />
            <BaseButton to="/dashboard" color="info" outline label="Back" />
          </BaseButtons>
          <p v-if="auth.error" class="text-red-600 text-sm mt-2">{{ auth.error }}</p>
        </template>
      </CardBox>
    </SectionFullScreen>
  </LayoutGuest>
</template>

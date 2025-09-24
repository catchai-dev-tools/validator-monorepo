<script setup>
import { mdiForwardburger, mdiBackburger, mdiMenu, mdiFileDocument, mdiAccountMultiple } from '@mdi/js'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// import menuAside from '@/menuAside.js'
import menuNavBar from '@/menuNavBar.js'
import { useDarkModeStore } from '@/stores/darkMode.js'
import { useDocsStore } from '@/stores/docs.js'
import { useAuthStore } from '@/stores/auth.js'
import BaseIcon from '@/components/BaseIcon.vue'
import FormControl from '@/components/FormControl.vue'
import NavBar from '@/components/NavBar.vue'
import NavBarItemPlain from '@/components/NavBarItemPlain.vue'
import AsideMenu from '@/components/AsideMenu.vue'
import FooterBar from '@/components/FooterBar.vue'

const layoutAsidePadding = 'xl:pl-60'

const darkModeStore = useDarkModeStore()
const docsStore = useDocsStore()
const auth = useAuthStore()

const router = useRouter()

const isAsideMobileExpanded = ref(false)
const isAsideLgActive = ref(false)

router.beforeEach(() => {
  isAsideMobileExpanded.value = false
  isAsideLgActive.value = false
})

const menuClick = (event, item) => {
  if (item.isToggleLightDark) {
    darkModeStore.set()
  }

  if (item.isLogout) {
    auth.logout()
    router.push({ name: 'login' })
  }
}

onMounted(() => {
  docsStore.fetchAll()
})

const baseMenu = computed(() => [
  { to: '/dashboard', label: 'Dashboard', icon: mdiMenu },
  { to: '/users', label: 'Users', icon: mdiAccountMultiple },
])

const docsMenu = computed(() =>
  (docsStore.items || []).map((dt) => ({
    label: dt.name,
    icon: mdiFileDocument,
    to: `/docs/${dt.id}/overview`,
    menu: [
      { label: 'Overview', to: `/docs/${dt.id}/overview` },
      { label: 'Rule Sets', to: `/docs/${dt.id}/rule-sets` },
      { label: 'Bulk Files', to: `/docs/${dt.id}/bulk-files` },
      { label: 'Runs', to: `/docs/${dt.id}/runs` },
    ],
  }))
)

const docsSection = computed(() => [
  {
    label: 'Document Types',
    icon: mdiFileDocument,
    to: '/docs',
    menu: [
      { label: 'All types', to: '/docs' },
      { label: 'New', to: '/docs/new' },
    ],
  },
])

const menuAsideComputed = computed(() => [
  ...baseMenu.value,
  ...docsSection.value,
  ...docsMenu.value,
])
</script>

<template>
  <div
    :class="{
      'overflow-hidden lg:overflow-visible': isAsideMobileExpanded,
    }"
  >
    <div
      :class="[layoutAsidePadding, { 'ml-60 lg:ml-0': isAsideMobileExpanded }]"
      class="pt-14 min-h-screen w-screen transition-position lg:w-auto bg-gray-50 dark:bg-slate-800 dark:text-slate-100"
    >
      <NavBar
        :menu="menuNavBar"
        :class="[layoutAsidePadding, { 'ml-60 lg:ml-0': isAsideMobileExpanded }]"
        @menu-click="menuClick"
      >
        <NavBarItemPlain
          display="flex lg:hidden"
          @click.prevent="isAsideMobileExpanded = !isAsideMobileExpanded"
        >
          <BaseIcon :path="isAsideMobileExpanded ? mdiBackburger : mdiForwardburger" size="24" />
        </NavBarItemPlain>
        <NavBarItemPlain display="hidden lg:flex xl:hidden" @click.prevent="isAsideLgActive = true">
          <BaseIcon :path="mdiMenu" size="24" />
        </NavBarItemPlain>
        <NavBarItemPlain use-margin>
          <FormControl placeholder="Search (ctrl+k)" ctrl-k-focus transparent borderless />
        </NavBarItemPlain>
      </NavBar>
      <AsideMenu
        :is-aside-mobile-expanded="isAsideMobileExpanded"
        :is-aside-lg-active="isAsideLgActive"
        :menu="menuAsideComputed"
        @menu-click="menuClick"
        @aside-lg-close-click="isAsideLgActive = false"
      />
      <slot />
      <FooterBar>
        Get more with
        <a href="https://tailwind-vue.justboil.me/" target="_blank" class="text-blue-600"
          >Premium version</a
        >
      </FooterBar>
    </div>
  </div>
</template>

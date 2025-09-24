import { createRouter, createWebHistory } from 'vue-router'
import Style from '@/views/StyleView.vue'
import Home from '@/views/HomeView.vue'
import { pinia } from '@/main.js'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  // Redirect root to dashboard
  { path: '/', redirect: '/dashboard' },
  // Optional style picker at /style
  {
    meta: {
      title: 'Select style',
    },
    path: '/style',
    name: 'style',
    component: Style,
  },
  {
    // Dashboard shows template HomeView (widgets/layout)
    meta: { title: 'Dashboard' },
    path: '/dashboard',
    name: 'dashboard',
    component: Home,
  },
  {
    meta: { title: 'Documents' },
    path: '/docs',
    name: 'docs',
    component: () => import('@/views/docs/DocumentTypesListView.vue'),
  },
  {
    meta: { title: 'New Document Type' },
    path: '/docs/new',
    name: 'doc-new',
    component: () => import('@/views/docs/NewDocumentTypeWizard.vue'),
  },
  {
    meta: { title: 'Doc Overview' },
    path: '/docs/:id/overview',
    name: 'doc-overview',
    component: () => import('@/views/docs/OverviewView.vue'),
  },
  {
    meta: { title: 'Edit Ingestion' },
    path: '/docs/:id/edit-ingestion',
    name: 'doc-edit-ingestion',
    component: () => import('@/views/docs/EditDocumentTypeIngestion.vue'),
  },
  {
    meta: { title: 'Edit Details' },
    path: '/docs/:id/edit-details',
    name: 'doc-edit-details',
    component: () => import('@/views/docs/EditDocumentTypeDetails.vue'),
  },
  {
    meta: { title: 'Doc Rule Sets' },
    path: '/docs/:id/rule-sets',
    name: 'doc-rule-sets',
    component: () => import('@/views/docs/RuleSetsView.vue'),
  },
  {
    meta: { title: 'Doc Bulk Files' },
    path: '/docs/:id/bulk-files',
    name: 'doc-bulk-files',
    component: () => import('@/views/docs/BulkFilesView.vue'),
  },
  {
    meta: { title: 'New Bulk File' },
    path: '/docs/:id/bulk-files/new',
    name: 'doc-bulk-files-new',
    component: () => import('@/views/docs/NewBulkFileView.vue'),
  },
  {
    meta: { title: 'Doc Runs' },
    path: '/docs/:id/runs',
    name: 'doc-runs',
    component: () => import('@/views/docs/RunsView.vue'),
  },
  {
    meta: { title: 'Users' },
    path: '/users',
    name: 'users',
    component: () => import('@/views/users/UsersListView.vue'),
  },
  {
    meta: {
      title: 'Tables',
    },
    path: '/tables',
    name: 'tables',
    component: () => import('@/views/TablesView.vue'),
  },
  {
    meta: {
      title: 'Forms',
    },
    path: '/forms',
    name: 'forms',
    component: () => import('@/views/FormsView.vue'),
  },
  {
    meta: {
      title: 'Profile',
    },
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
  },
  {
    meta: {
      title: 'Ui',
    },
    path: '/ui',
    name: 'ui',
    component: () => import('@/views/UiView.vue'),
  },
  {
    meta: {
      title: 'Responsive layout',
    },
    path: '/responsive',
    name: 'responsive',
    component: () => import('@/views/ResponsiveView.vue'),
  },
  {
    meta: {
      title: 'Login',
    },
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    meta: {
      title: 'Error',
    },
    path: '/error',
    name: 'error',
    component: () => import('@/views/ErrorView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

// Simple auth guard: require auth for all routes except public ones
const publicRoutes = new Set(['login', 'style'])
router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  if (!publicRoutes.has(to.name) && !auth.isAuthenticated) {
    // Try to restore session
    await auth.fetchMe()
  }
  if (!publicRoutes.has(to.name) && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '@/plugins/pinia'
import { loadAgentData } from '@/services/agent'
import { refreshPendingPlanCount } from '@/services/manager-plans'
import { useAgentVisitsStore } from '@/stores/agent-visits'
import { useReferenceStore } from '@/stores/reference'
import { homeFor, MOCK_AUTH, useSessionStore, type Role } from '@/stores/session'
import { adminRoutes } from './routes/admin'
import { agentRoutes } from './routes/agent'
import { managerRoutes } from './routes/shared'
import { schoolRoutes } from './routes/school'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    {
      path: '/',
      component: () => import('@/views/shared/RoleLayout.vue'),
      children: [...managerRoutes, ...schoolRoutes, ...adminRoutes, ...agentRoutes],
    },
    ...(import.meta.env.DEV
      ? [{ path: '/_komponen', name: 'komponen', component: () => import('@/views/shared/ComponentGallery.vue'), meta: { title: 'Galeri komponen' } }]
      : []),
  ],
})

// Peran yang boleh membuka tiap bagian. Backend tetap pengaman utama; ini hanya pengalihan.
function allowedRoles(path: string): Role[] {
  if (path.startsWith('/agent')) return ['AGENT']
  if (path === '/akun' || path.startsWith('/akun/') || path === '/master-data') return ['ADMIN']
  return ['ADMIN', 'MANAGER']
}

let agentLoaded = false
router.beforeEach(async (to) => {
  const session = useSessionStore(pinia)
  if (MOCK_AUTH) {
    const as = typeof to.query.as === 'string' ? (to.query.as.toUpperCase() as Role) : null
    if (as && ['ADMIN', 'MANAGER', 'AGENT'].includes(as)) session.setMock(as)
    else if (!session.loaded && to.name !== 'login') session.setMock('MANAGER')
    else if (!session.loaded) session.loaded = true // halaman login tanpa sesi
  }
  await session.load()
  if (to.name === 'login') return session.user ? homeFor(session.user.role) : true
  if (to.name === 'komponen') return true
  if (!session.user) return { name: 'login' }
  if (session.user.role !== 'AGENT') {
    await useReferenceStore(pinia).load()
    if (!MOCK_AUTH) void refreshPendingPlanCount()
  }
  else if (!MOCK_AUTH && !agentLoaded) { await Promise.all([loadAgentData(), useAgentVisitsStore(pinia).load()]); agentLoaded = true }
  if (to.path === '/') return homeFor(session.user.role)
  if (!allowedRoles(to.path).includes(session.user.role)) return homeFor(session.user.role)
  return true
})

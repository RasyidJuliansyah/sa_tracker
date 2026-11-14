import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '@/plugins/pinia'
import { useSessionStore, type Role } from '@/stores/session'
import { adminRoutes } from './routes/admin'
import { agentRoutes } from './routes/agent'
import { managerRoutes } from './routes/shared'
import { schoolRoutes } from './routes/school'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    { path: '/', redirect: '/dashboard' },
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

// Hanya saat dev: ?as=admin|manager|agent mengganti peran sementara untuk melihat rangka tiap peran.
// Hapus di langkah login (backend), diganti guard berdasarkan sesi sungguhan.
if (import.meta.env.DEV) {
  router.beforeEach((to) => {
    const as = typeof to.query.as === 'string' ? (to.query.as.toUpperCase() as Role) : null
    if (as && ['ADMIN', 'MANAGER', 'AGENT'].includes(as)) useSessionStore(pinia).setMock(as)
  })
}

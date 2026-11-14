import type { RouteRecordRaw } from 'vue-router'

const Placeholder = () => import('@/views/shared/PlaceholderView.vue')

export const agentRoutes: RouteRecordRaw[] = [
  { path: '/agent', name: 'agent-beranda', component: Placeholder, meta: { title: 'Beranda' } },
  { path: '/agent/check-in', name: 'agent-check-in', component: Placeholder, meta: { title: 'Check-in', back: true } },
  { path: '/agent/check-out', name: 'agent-check-out', component: Placeholder, meta: { title: 'Check-out', back: true, hideNav: true } },
  { path: '/agent/sekolah-saya', name: 'agent-sekolah', component: Placeholder, meta: { title: 'Sekolah saya' } },
  { path: '/agent/sekolah/:id', name: 'agent-sekolah-detail', component: Placeholder, meta: { title: 'Detail sekolah', back: true } },
  { path: '/agent/riwayat', name: 'agent-riwayat', component: Placeholder, meta: { title: 'Riwayat' } },
]

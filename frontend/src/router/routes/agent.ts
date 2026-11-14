import type { RouteRecordRaw } from 'vue-router'

const Placeholder = () => import('@/views/shared/PlaceholderView.vue')

export const agentRoutes: RouteRecordRaw[] = [
  { path: '/agent', name: 'agent-beranda', component: () => import('@/views/agent/BerandaView.vue'), meta: { title: 'Beranda' } },
  { path: '/agent/check-in', name: 'agent-check-in', component: () => import('@/views/agent/CheckInView.vue'), meta: { title: 'Check-in', back: true, hideNav: true } },
  { path: '/agent/check-out', name: 'agent-check-out', component: Placeholder, meta: { title: 'Check-out', back: true, hideNav: true } },
  { path: '/agent/sekolah-saya', name: 'agent-sekolah', component: Placeholder, meta: { title: 'Sekolah saya' } },
  { path: '/agent/sekolah/:id', name: 'agent-sekolah-detail', component: Placeholder, meta: { title: 'Detail sekolah', back: true } },
  { path: '/agent/riwayat', name: 'agent-riwayat', component: Placeholder, meta: { title: 'Riwayat' } },
]

import type { RouteRecordRaw } from 'vue-router'

export const agentRoutes: RouteRecordRaw[] = [
  { path: '/agent', name: 'agent-beranda', component: () => import('@/views/agent/BerandaView.vue'), meta: { title: 'Beranda' } },
  { path: '/agent/check-in', name: 'agent-check-in', component: () => import('@/views/agent/CheckInView.vue'), meta: { title: 'Check-in', back: true, hideNav: true } },
  { path: '/agent/check-out', name: 'agent-check-out', component: () => import('@/views/agent/CheckOutView.vue'), meta: { title: 'Check-out', back: true, hideNav: true } },
  { path: '/agent/check-out/selesai', name: 'agent-check-out-selesai', component: () => import('@/views/agent/CheckOutDoneView.vue'), meta: { title: 'Kunjungan selesai', hideNav: true } },
  { path: '/agent/sekolah-saya', name: 'agent-sekolah', component: () => import('@/views/agent/SekolahSayaView.vue'), meta: { title: 'Sekolah saya' } },
  { path: '/agent/sekolah/:id', name: 'agent-sekolah-detail', component: () => import('@/views/agent/SchoolDetailView.vue'), meta: { title: 'Detail sekolah', back: true } },
  { path: '/agent/riwayat', name: 'agent-riwayat', component: () => import('@/views/agent/RiwayatView.vue'), meta: { title: 'Riwayat' } },
]

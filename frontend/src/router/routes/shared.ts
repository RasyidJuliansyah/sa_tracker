import type { RouteRecordRaw } from 'vue-router'

// Halaman admin dan manager yang dipakai bersama. Satu file per bagian supaya tiap layar bisa dikerjakan
// terpisah: ganti komponen Placeholder dengan view sungguhan, jangan ubah path atau meta.title.
const Placeholder = () => import('@/views/shared/PlaceholderView.vue')

export const managerRoutes: RouteRecordRaw[] = [
  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/manager/DashboardView.vue'), meta: { title: 'Dashboard' } },
  { path: '/rekap', name: 'rekap', component: () => import('@/views/manager/RekapView.vue'), meta: { title: 'Rekap kunjungan' } },
  { path: '/rekap/:id', name: 'rekap-detail', component: () => import('@/views/manager/VisitDetailView.vue'), meta: { title: 'Detail kunjungan' } },
  { path: '/akun-agent', name: 'akun-agent', component: () => import('@/views/manager/AkunAgentView.vue'), meta: { title: 'Akun agent' } },
]

import type { RouteRecordRaw } from 'vue-router'

// Halaman admin dan manager yang dipakai bersama. Satu file per bagian supaya tiap layar bisa dikerjakan
// terpisah: ganti komponen Placeholder dengan view sungguhan, jangan ubah path atau meta.title.
const Placeholder = () => import('@/views/shared/PlaceholderView.vue')

export const managerRoutes: RouteRecordRaw[] = [
  { path: '/dashboard', name: 'dashboard', component: Placeholder, meta: { title: 'Dashboard' } },
  { path: '/rekap', name: 'rekap', component: Placeholder, meta: { title: 'Rekap kunjungan' } },
  { path: '/rekap/:id', name: 'rekap-detail', component: Placeholder, meta: { title: 'Detail kunjungan' } },
  { path: '/akun-agent', name: 'akun-agent', component: Placeholder, meta: { title: 'Akun agent' } },
  { path: '/penugasan', name: 'penugasan', component: Placeholder, meta: { title: 'Penugasan' } },
  { path: '/target-retention', name: 'target-retention', component: Placeholder, meta: { title: 'Target retention' } },
]

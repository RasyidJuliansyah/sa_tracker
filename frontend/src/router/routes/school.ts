import type { RouteRecordRaw } from 'vue-router'

const Placeholder = () => import('@/views/shared/PlaceholderView.vue')

export const schoolRoutes: RouteRecordRaw[] = [
  { path: '/sekolah', name: 'sekolah', component: Placeholder, meta: { title: 'Sekolah' } },
  { path: '/sekolah/baru', name: 'sekolah-baru', component: Placeholder, meta: { title: 'Tambah sekolah' } },
  { path: '/sekolah/:id', name: 'sekolah-detail', component: Placeholder, meta: { title: 'Halaman sekolah' } },
  { path: '/penugasan', name: 'penugasan', component: Placeholder, meta: { title: 'Penugasan' } },
  { path: '/target-retention', name: 'target-retention', component: Placeholder, meta: { title: 'Target retention' } },
  { path: '/impor-ekspor', name: 'impor-ekspor', component: Placeholder, meta: { title: 'Impor & ekspor' } },
]

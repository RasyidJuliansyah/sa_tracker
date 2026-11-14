import type { RouteRecordRaw } from 'vue-router'

const Placeholder = () => import('@/views/shared/PlaceholderView.vue')
const SchoolDetail = () => import('@/views/school/SchoolDetailView.vue')
const SchoolForm = () => import('@/views/school/SchoolFormView.vue')
const Assignment = () => import('@/views/school/AssignmentView.vue')
const RetentionTarget = () => import('@/views/school/RetentionTargetView.vue')
const ImportExport = () => import('@/views/school/ImportExportView.vue')
const SchoolList = () => import('@/views/school/SchoolListView.vue')

export const schoolRoutes: RouteRecordRaw[] = [
  { path: '/sekolah', name: 'sekolah', component: SchoolList, meta: { title: 'Sekolah' } },
  { path: '/sekolah/baru', name: 'sekolah-baru', component: SchoolForm, meta: { title: 'Tambah sekolah' } },
  { path: '/sekolah/:id', name: 'sekolah-detail', component: SchoolDetail, meta: { title: 'Halaman sekolah' } },
  { path: '/penugasan', name: 'penugasan', component: Assignment, meta: { title: 'Penugasan' } },
  { path: '/target-retention', name: 'target-retention', component: RetentionTarget, meta: { title: 'Target retention' } },
  { path: '/impor-ekspor', name: 'impor-ekspor', component: ImportExport, meta: { title: 'Impor & ekspor' } },
]

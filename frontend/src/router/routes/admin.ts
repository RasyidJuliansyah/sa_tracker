import type { RouteRecordRaw } from 'vue-router'

const Placeholder = () => import('@/views/shared/PlaceholderView.vue')
const MasterData = () => import('@/views/admin/MasterDataView.vue')
const AuditLog = () => import('@/views/admin/AuditLogView.vue')
const Akun = () => import('@/views/admin/AkunView.vue')
const AkunImportExport = () => import('@/views/admin/AkunImportExportView.vue')

export const adminRoutes: RouteRecordRaw[] = [
  { path: '/akun', name: 'akun', component: Akun, meta: { title: 'Akun' } },
  { path: '/akun/impor-ekspor', name: 'akun-impor-ekspor', component: AkunImportExport, meta: { title: 'Impor & ekspor akun' } },
  { path: '/master-data', name: 'master-data', component: MasterData, meta: { title: 'Master jenjang & paket' } },
  { path: '/audit-log', name: 'audit-log', component: AuditLog, meta: { title: 'Audit log' } },
]

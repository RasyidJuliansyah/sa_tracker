import type { RouteRecordRaw } from 'vue-router'

const Placeholder = () => import('@/views/shared/PlaceholderView.vue')
const Akun = () => import('@/views/admin/AkunView.vue')

export const adminRoutes: RouteRecordRaw[] = [
  { path: '/akun', name: 'akun', component: Akun, meta: { title: 'Akun' } },
  { path: '/master-data', name: 'master-data', component: Placeholder, meta: { title: 'Master data' } },
  { path: '/audit-log', name: 'audit-log', component: Placeholder, meta: { title: 'Audit log' } },
]

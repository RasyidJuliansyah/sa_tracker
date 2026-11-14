import type { Role } from '@/stores/session'

export interface NavItem {
  label: string
  to: string
  icon: string
  /** Awalan path lain yang ikut menandai item ini aktif (mis. halaman detail). */
  alsoActiveFor?: string[]
}

const dashboard: NavItem = { label: 'Dashboard', to: '/dashboard', icon: 'mdi-view-dashboard-outline' }
const rekap: NavItem = { label: 'Rekap kunjungan', to: '/rekap', icon: 'mdi-clipboard-text-outline', alsoActiveFor: ['/rekap/'] }
const sekolah: NavItem = { label: 'Sekolah', to: '/sekolah', icon: 'mdi-school-outline', alsoActiveFor: ['/sekolah/'] }
const penugasan: NavItem = { label: 'Penugasan', to: '/penugasan', icon: 'mdi-swap-horizontal' }
const target: NavItem = { label: 'Target retention', to: '/target-retention', icon: 'mdi-target' }
const imporEkspor: NavItem = { label: 'Impor & ekspor', to: '/impor-ekspor', icon: 'mdi-file-delimited-outline' }
const audit: NavItem = { label: 'Audit log', to: '/audit-log', icon: 'mdi-history' }

// Urutan dan nama mengikuti Figma: Sidebar/Manager dan Sidebar/Admin
export const sidebarItems: Record<'ADMIN' | 'MANAGER', NavItem[]> = {
  MANAGER: [
    dashboard, rekap, sekolah, penugasan, target, imporEkspor,
    { label: 'Akun agent', to: '/akun-agent', icon: 'mdi-account-multiple-outline' },
    audit,
  ],
  ADMIN: [
    dashboard, sekolah, penugasan, target, imporEkspor,
    { label: 'Akun', to: '/akun', icon: 'mdi-account-multiple-outline' },
    { label: 'Master data', to: '/master-data', icon: 'mdi-shape-outline' },
    audit,
  ],
}

// Navigasi bawah HP untuk agent (Figma: HP/Nav bawah)
export const agentNav: NavItem[] = [
  { label: 'Beranda', to: '/agent', icon: 'mdi-home-outline' },
  { label: 'Check-in', to: '/agent/check-in', icon: 'mdi-map-marker-check-outline' },
  { label: 'Sekolah saya', to: '/agent/sekolah-saya', icon: 'mdi-school-outline', alsoActiveFor: ['/agent/sekolah/'] },
  { label: 'Riwayat', to: '/agent/riwayat', icon: 'mdi-history' },
]

export function isRoleDesktop(role: Role): role is 'ADMIN' | 'MANAGER' {
  return role !== 'AGENT'
}

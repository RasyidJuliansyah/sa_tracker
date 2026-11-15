// Data tiruan layar admin. Isinya disamakan dengan desain Figma "05 Admin" (hari ini = 14 Nov 2026).
import type { IndoTimezone } from '@/utils/timezone'

export type AccountRole = 'ADMIN' | 'MANAGER' | 'AGENT'
export type AccountStatus = 'ACTIVE' | 'MUST_CHANGE_PASSWORD' | 'INACTIVE'

export interface MockAccount {
  id: number
  name: string
  email: string
  role: AccountRole
  timezone: IndoTimezone
  status: AccountStatus
  lastLoginLabel: string
}

export interface MockMasterItem {
  id: number
  name: string
  schoolCount: number
  active: boolean
}

export type AuditAction = 'CHECK_OUT' | 'CHECK_IN' | 'LOGIN' | 'EXPORT' | 'MOVE' | 'CREATE' | 'UPDATE' | 'IMPORT' | 'DEACTIVATE' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE'
export interface AuditChange { field: string; before: string | null; after: string | null }
export interface MockAuditEntry {
  id: number
  at: string // ISO, UTC offset eksplisit
  actor: string
  actorRole: 'Admin' | 'Manager' | 'Agent'
  action: AuditAction
  dataType: string
  dataLabel: string
  tableName: string
  recordIds: string
  changes: AuditChange[]
}

// Akun login awal dev:mock, selaras dengan backend/prisma/seed.ts (password: SkollaEdu).
export const initialAccounts: MockAccount[] = [
  { id: 1, name: 'Admin', email: 'admin@skolla.education', role: 'ADMIN', timezone: 'WIB', status: 'ACTIVE', lastLoginLabel: 'Belum pernah login' },
  { id: 2, name: 'Syifa Mahmudah', email: 'syifa@skolla.education', role: 'MANAGER', timezone: 'WIB', status: 'ACTIVE', lastLoginLabel: 'Belum pernah login' },
  { id: 3, name: 'Akhmad Mukhibun', email: 'akhmad@skolla.education', role: 'AGENT', timezone: 'WIB', status: 'ACTIVE', lastLoginLabel: 'Belum pernah login' },
]

// Master data, selaras dengan backend/prisma/seed.ts. schoolCount 0 sampai ada sekolah asli.
export const initialLevels: MockMasterItem[] = [
  { id: 1, name: 'SD', schoolCount: 0, active: true },
  { id: 2, name: 'SMP', schoolCount: 0, active: true },
  { id: 3, name: 'SMA', schoolCount: 0, active: true },
]

export const initialPackages: MockMasterItem[] = [
  { id: 1, name: 'Skolla Basic', schoolCount: 0, active: true },
  { id: 2, name: 'Skolla Plus', schoolCount: 0, active: true },
]

// Sengaja kosong: audit log asli tercatat otomatis oleh backend setiap ada aksi (login, check-in/out,
// impor, dll), bukan di-hardcode di sini.
export const initialAudit: MockAuditEntry[] = []

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

export type AuditAction = 'CHECK_OUT' | 'CHECK_IN' | 'LOGIN' | 'EXPORT' | 'MOVE' | 'CREATE' | 'UPDATE' | 'IMPORT' | 'DEACTIVATE'
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

export const initialAccounts: MockAccount[] = [
  { id: 1, name: 'Fajar Hidayat', email: 'fajar.hidayat@skolla.id', role: 'ADMIN', timezone: 'WIB', status: 'ACTIVE', lastLoginLabel: 'Hari ini, 08.10' },
  { id: 2, name: 'Rina Nurhayati', email: 'rina.nurhayati@skolla.id', role: 'MANAGER', timezone: 'WIB', status: 'ACTIVE', lastLoginLabel: 'Hari ini, 08.01' },
  { id: 3, name: 'Sinta Maharani', email: 'sinta.maharani@skolla.id', role: 'MANAGER', timezone: 'WIB', status: 'MUST_CHANGE_PASSWORD', lastLoginLabel: 'Belum pernah login' },
  { id: 4, name: 'Dimas Saputra', email: 'dimas.saputra@skolla.id', role: 'AGENT', timezone: 'WIB', status: 'ACTIVE', lastLoginLabel: 'Hari ini, 08.52' },
  { id: 5, name: 'Ayu Lestari', email: 'ayu.lestari@skolla.id', role: 'AGENT', timezone: 'WITA', status: 'ACTIVE', lastLoginLabel: 'Hari ini, 07.40' },
  { id: 6, name: 'Yohanes Wenda', email: 'yohanes.wenda@skolla.id', role: 'AGENT', timezone: 'WIT', status: 'ACTIVE', lastLoginLabel: 'Kemarin, 16.05' },
  { id: 7, name: 'Bagus Pratama', email: 'bagus.pratama@skolla.id', role: 'AGENT', timezone: 'WIB', status: 'INACTIVE', lastLoginLabel: '2 Sep 2026' },
]

export const initialLevels: MockMasterItem[] = [
  { id: 1, name: 'SD', schoolCount: 5, active: true },
  { id: 2, name: 'SMP', schoolCount: 4, active: true },
  { id: 3, name: 'SMA', schoolCount: 5, active: true },
  { id: 4, name: 'SMK', schoolCount: 1, active: true },
  { id: 5, name: 'MI', schoolCount: 0, active: false },
]

export const initialPackages: MockMasterItem[] = [
  { id: 1, name: 'Dasar', schoolCount: 3, active: true },
  { id: 2, name: 'Standar', schoolCount: 7, active: true },
  { id: 3, name: 'Premium', schoolCount: 5, active: true },
  { id: 4, name: 'Uji coba', schoolCount: 0, active: false },
]

const move: AuditChange[] = [
  { field: 'agent', before: 'Dimas Saputra', after: 'Ayu Lestari' },
  { field: 'unassigned_at (#88)', before: null, after: '13 Nov 2026 15.30' },
  { field: 'share_percent (#131)', before: null, after: '100' },
]

// Sembilan baris pertama sama dengan Figma; sisanya dibangkitkan supaya total 312 dan paginasi nyata.
const head: MockAuditEntry[] = [
  { id: 312, at: '2026-11-14T10:40:00+07:00', actor: 'Dimas Saputra', actorRole: 'Agent', action: 'CHECK_OUT', dataType: 'Kunjungan', dataLabel: 'Kunjungan #2493', tableName: 'visits', recordIds: '#2493', changes: [] },
  { id: 311, at: '2026-11-14T09:15:00+07:00', actor: 'Dimas Saputra', actorRole: 'Agent', action: 'CHECK_IN', dataType: 'Kunjungan', dataLabel: 'Kunjungan #2493', tableName: 'visits', recordIds: '#2493', changes: [] },
  { id: 310, at: '2026-11-14T08:52:00+07:00', actor: 'Dimas Saputra', actorRole: 'Agent', action: 'LOGIN', dataType: 'Sesi', dataLabel: 'Sesi', tableName: 'sessions', recordIds: '', changes: [] },
  { id: 309, at: '2026-11-14T08:05:00+07:00', actor: 'Rina Nurhayati', actorRole: 'Manager', action: 'EXPORT', dataType: 'Rekap kunjungan', dataLabel: 'Rekap kunjungan', tableName: 'visits', recordIds: '', changes: [] },
  { id: 308, at: '2026-11-13T15:30:00+07:00', actor: 'Rina Nurhayati', actorRole: 'Manager', action: 'MOVE', dataType: 'Penugasan', dataLabel: 'Penugasan • SMP Gemilang Bogor', tableName: 'school_assignments', recordIds: '#88, #131', changes: move },
  { id: 307, at: '2026-11-13T11:02:00+07:00', actor: 'Fajar Hidayat', actorRole: 'Admin', action: 'CREATE', dataType: 'Akun', dataLabel: 'Akun • Sinta Maharani', tableName: 'users', recordIds: '#3', changes: [] },
  { id: 306, at: '2026-11-12T16:20:00+07:00', actor: 'Rina Nurhayati', actorRole: 'Manager', action: 'UPDATE', dataType: 'Kontrak', dataLabel: 'Kontrak • SMA Bina Insani Bekasi', tableName: 'school_contracts', recordIds: '#41', changes: [] },
  { id: 305, at: '2026-11-10T09:00:00+07:00', actor: 'Fajar Hidayat', actorRole: 'Admin', action: 'IMPORT', dataType: 'Sekolah', dataLabel: 'Sekolah • 45 baris', tableName: 'schools', recordIds: '', changes: [] },
  { id: 304, at: '2026-11-09T14:11:00+07:00', actor: 'Fajar Hidayat', actorRole: 'Admin', action: 'DEACTIVATE', dataType: 'Akun', dataLabel: 'Akun • Bagus Pratama', tableName: 'users', recordIds: '#7', changes: [] },
  { id: 303, at: '2026-11-08T10:30:00+07:00', actor: 'Ayu Lestari', actorRole: 'Agent', action: 'CHECK_OUT', dataType: 'Kunjungan', dataLabel: 'Kunjungan #2488', tableName: 'visits', recordIds: '#2488', changes: [] },
]

const actors: [string, MockAuditEntry['actorRole']][] = [
  ['Dimas Saputra', 'Agent'], ['Ayu Lestari', 'Agent'], ['Yohanes Wenda', 'Agent'], ['Rina Nurhayati', 'Manager'], ['Fajar Hidayat', 'Admin'],
]
const kinds: [AuditAction, string, string, string][] = [
  ['CHECK_IN', 'Kunjungan', 'Kunjungan', 'visits'], ['CHECK_OUT', 'Kunjungan', 'Kunjungan', 'visits'], ['LOGIN', 'Sesi', 'Sesi', 'sessions'],
  ['UPDATE', 'Sekolah', 'Sekolah', 'schools'], ['CREATE', 'Akun', 'Akun', 'users'],
]
const tail: MockAuditEntry[] = Array.from({ length: 302 }, (_, i) => {
  const id = 302 - i
  const [actor, actorRole] = actors[i % actors.length]!
  const [action, dataType, label, tableName] = kinds[i % kinds.length]!
  const date = new Date(Date.UTC(2026, 10, 14 - Math.floor(i / 45), 1 + (i % 8), (i * 7) % 60))
  return {
    id, at: date.toISOString(), actor, actorRole, action, dataType,
    dataLabel: dataType === 'Sesi' ? 'Sesi' : `${label} #${2400 + (i % 80)}`, tableName, recordIds: `#${2400 + (i % 80)}`, changes: [],
  }
})

export const initialAudit: MockAuditEntry[] = [...head, ...tail]

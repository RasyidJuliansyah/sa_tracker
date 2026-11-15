// Data tiruan layar Sekolah & Kontrak. Isinya disamakan dengan desain Figma "04 Sekolah & Kontrak" (hari ini = 14 Nov 2026).
// Angka retention dan kohort adalah angka tiruan dari Figma; rumus aslinya nanti di backend.
import type { IndoTimezone } from '@/utils/timezone'

export const MOCK_TODAY = '2026-11-14'

export type Level = 'SD' | 'SMP' | 'SMA' | 'SMK'
export type Pkg = 'Dasar' | 'Standar' | 'Premium'
export const LEVELS: Level[] = ['SD', 'SMP', 'SMA', 'SMK']
export const PACKAGES: Pkg[] = ['Dasar', 'Standar', 'Premium']

export interface MockAgent { id: number; name: string; timezone: IndoTimezone; retention2026: number }
export const agents: MockAgent[] = []


export interface MockSchool {
  id: number
  lmsSchoolId: number | null
  npsn: string
  name: string
  level: Level
  pkg: Pkg
  timezone: IndoTimezone
  city: string
  address: string
  pic: string
  picContact: string
  coopStart: string
  onboarding: string | null
  activeUse: string | null
  coopEnd: string
}

export interface MockContract {
  id: number
  schoolId: number
  label: string
  start: string
  end: string
  value: number
  signedDate: string
  type: 'FIRST' | 'RENEWAL'
  previousContractId: number | null
  note: string
}

export interface MockAssignment {
  id: number
  schoolId: number
  agentId: number
  sharePercent: number
  assignedAt: string
  unassignedAt: string | null
}

export interface MockVisit { id: number; schoolId: number; date: string; agent: string; report: string; durationMinutes: number }

export type ChangeAction = 'Check-out' | 'Check-in' | 'Ubah' | 'Tambah' | 'Impor'
export interface MockSchoolChange {
  id: number
  schoolId: number
  at: string // ISO dengan offset WIB
  actor: string
  actorRole: 'Admin' | 'Manager' | 'Agent'
  action: ChangeAction
  data: string
  before: string | null
  after: string
}

const s = (
  id: number, npsn: string, name: string, level: Level, pkg: Pkg, city: string, timezone: IndoTimezone,
  coopStart: string, coopEnd: string, extra: Partial<MockSchool> = {},
): MockSchool => ({
  id, npsn, name, level, pkg, city, timezone, coopStart, coopEnd, lmsSchoolId: null,
  address: `Jl. Pendidikan No. ${id * 3}, ${city}`, pic: 'Ibu Rahma', picContact: `0812-5550-${1000 + id}`,
  onboarding: null, activeUse: null, ...extra,
})

// Sengaja kosong: data sekolah asli Skolla Edtech diisi lewat aplikasi (impor CSV atau form
// tambah sekolah), bukan di-hardcode di sini. Helper `s` disisakan untuk uji lokal bila perlu.
export const initialSchools: MockSchool[] = []
void s

let cid = 0
const c = (
  schoolId: number, label: string, start: string, end: string, value: number, signedDate: string,
  previousContractId: number | null = null, note = '',
): MockContract => ({ id: ++cid, schoolId, label, start, end, value, signedDate, type: previousContractId ? 'RENEWAL' : 'FIRST', previousContractId, note })
void c

export const initialContracts: MockContract[] = []

const a = (id: number, schoolId: number, agentId: number, assignedAt: string): MockAssignment => ({ id, schoolId, agentId, sharePercent: 100, assignedAt, unassignedAt: null })
void a
export const initialAssignments: MockAssignment[] = []

export const initialVisits: MockVisit[] = []

export const initialChanges: MockSchoolChange[] = []

// NPSN yang sudah ada di server tetapi tidak tampil di daftar contoh (dipakai pratinjau impor: "diperbarui").
export const extraExistingNpsn: string[] = []

// Target retention per tahun.
export interface MockTargetYear {
  year: number
  targetPercent: number
  isDefault: boolean
  cohortValue: number
  signedValue: number
  retention: number
  status: 'NONE' | 'ON_TARGET' | 'BELOW'
}
export const DEFAULT_TARGET = 65
export const initialTargets: MockTargetYear[] = []

export interface MockExportLog { id: number; at: string; actor: string; kind: string; filter: string; rows: number }
export const initialExports: MockExportLog[] = []


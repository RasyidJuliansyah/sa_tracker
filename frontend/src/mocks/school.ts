// Data tiruan layar Sekolah & Kontrak. Isinya disamakan dengan desain Figma "04 Sekolah & Kontrak" (hari ini = 14 Nov 2026).
// Angka retention dan kohort adalah angka tiruan dari Figma; rumus aslinya nanti di backend.
import type { IndoTimezone } from '@/utils/timezone'

export const MOCK_TODAY = '2026-11-14'

export type Level = 'SD' | 'SMP' | 'SMA' | 'SMK'
export type Pkg = 'Dasar' | 'Standar' | 'Premium'
export const LEVELS: Level[] = ['SD', 'SMP', 'SMA', 'SMK']
export const PACKAGES: Pkg[] = ['Dasar', 'Standar', 'Premium']

export interface MockAgent { id: number; name: string; timezone: IndoTimezone; retention2026: number }
export const agents: MockAgent[] = [
  { id: 1, name: 'Dimas Saputra', timezone: 'WIB', retention2026: 80.0 },
  { id: 2, name: 'Ayu Lestari', timezone: 'WITA', retention2026: 62.5 },
  { id: 3, name: 'Yohanes Wenda', timezone: 'WIT', retention2026: 54.0 },
]

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

export const initialSchools: MockSchool[] = [
  s(1, '20219874', 'SMA Bina Insani Bekasi', 'SMA', 'Premium', 'Bekasi', 'WIB', '2025-01-02', '2027-12-31', { lmsSchoolId: 10211 }),
  s(2, '30406612', 'SMP Tunas Bangsa Balikpapan', 'SMP', 'Standar', 'Balikpapan', 'WITA', '2025-01-02', '2027-12-31', { lmsSchoolId: 10304 }),
  s(3, '20231456', 'SMP Gemilang Bogor', 'SMP', 'Standar', 'Bogor', 'WIB', '2025-10-01', '2026-09-30'),
  s(4, '20228801', 'SD Cahaya Ilmu Depok', 'SD', 'Standar', 'Depok', 'WIB', '2024-01-02', '2026-12-31', {
    lmsSchoolId: 10518, address: 'Jl. Margonda Raya No. 210, Depok', pic: 'Bapak Hendra Gunawan', picContact: '0813-9876-5432',
    onboarding: '2024-01-15', activeUse: '2024-02-05',
  }),
  s(5, '40311208', 'SMA Mutiara Makassar', 'SMA', 'Premium', 'Makassar', 'WITA', '2025-11-01', '2026-10-31'),
  s(6, '20217735', 'SMK Taruna Jaya Karawang', 'SMK', 'Premium', 'Karawang', 'WIB', '2026-07-01', '2027-06-30'),
  s(7, '30410977', 'SD Kasih Bunda Samarinda', 'SD', 'Dasar', 'Samarinda', 'WITA', '2026-08-01', '2027-07-31'),
  s(8, '60102345', 'SMA Lentera Jayapura', 'SMA', 'Standar', 'Jayapura', 'WIT', '2025-09-01', '2026-08-31'),
  s(9, '20219102', 'SMP Nusa Indah Bekasi', 'SMP', 'Dasar', 'Bekasi', 'WIB', '2026-03-01', '2027-02-28'),
  s(10, '20104417', 'SMA Lentera Jakarta Timur', 'SMA', 'Standar', 'Jakarta Timur', 'WIB', '2026-01-01', '2026-12-31'),
  s(11, '50305511', 'SD Tunas Harapan Kupang', 'SD', 'Standar', 'Kupang', 'WITA', '2026-04-01', '2027-03-31'),
  s(12, '60208833', 'SMA Cendekia Ambon', 'SMA', 'Standar', 'Ambon', 'WIT', '2026-07-01', '2027-06-30'),
  s(13, '61100234', 'SMP Harapan Jaya Pontianak', 'SMP', 'Standar', 'Pontianak', 'WIB', '2026-02-01', '2027-01-31'),
  s(14, '60102990', 'SD Bhakti Mulia Sorong', 'SD', 'Dasar', 'Sorong', 'WIT', '2026-05-01', '2027-04-30'),
  s(15, '60103455', 'SMK Pelita Timika', 'SMK', 'Premium', 'Timika', 'WIT', '2026-06-01', '2027-05-31'),
]

let cid = 0
const c = (
  schoolId: number, label: string, start: string, end: string, value: number, signedDate: string,
  previousContractId: number | null = null, note = '',
): MockContract => ({ id: ++cid, schoolId, label, start, end, value, signedDate, type: previousContractId ? 'RENEWAL' : 'FIRST', previousContractId, note })

const m = 1_000_000
export const initialContracts: MockContract[] = [
  // 1: Bina Insani (sudah diperpanjang ke 2027)
  c(1, 'Kontrak 2026', '2026-01-01', '2026-12-31', 80 * m, '2025-12-10'),
  c(1, 'Kontrak 2027', '2027-01-01', '2027-12-31', 80 * m, '2026-11-02', 1),
  // 2: Tunas Bangsa (sudah diperpanjang)
  c(2, 'Kontrak 2026', '2026-01-01', '2026-12-31', 20 * m, '2025-12-05'),
  c(2, 'Kontrak 2027', '2027-01-01', '2027-12-31', 20 * m, '2026-10-20', 3),
  c(3, 'Kontrak 2025', '2025-10-01', '2026-09-30', 45 * m, '2025-09-18'),
  // 4: Cahaya Ilmu (tiga kontrak, id 6, 7, 8)
  c(4, 'Kontrak 2024', '2024-01-01', '2024-12-31', 54 * m, '2023-12-20', null, 'Kontrak pertama'),
  c(4, 'Kontrak 2025', '2025-01-01', '2025-12-31', 54 * m, '2024-12-02', 6),
  c(4, 'Kontrak 2026', '2026-01-01', '2026-12-31', 60 * m, '2025-12-12', 7),
  c(5, 'Kontrak 2025', '2025-11-01', '2026-10-31', 96 * m, '2025-10-15'),
  c(6, 'Kontrak 2026', '2026-07-01', '2027-06-30', 115 * m, '2026-06-12'),
  c(7, 'Kontrak 2026', '2026-08-01', '2027-07-31', 36 * m, '2026-07-20'),
  c(8, 'Kontrak 2025', '2025-09-01', '2026-08-31', 74 * m, '2025-08-14'),
  c(9, 'Kontrak 2026', '2026-03-01', '2027-02-28', 30 * m, '2026-02-12'),
  c(10, 'Kontrak 2026', '2026-01-01', '2026-12-31', 52 * m, '2025-12-15'),
  c(11, 'Kontrak 2026', '2026-04-01', '2027-03-31', 28 * m, '2026-03-10'),
  c(12, 'Kontrak 2026', '2026-07-01', '2027-06-30', 64 * m, '2026-06-18'),
  c(13, 'Kontrak 2026', '2026-02-01', '2027-01-31', 40 * m, '2026-01-14'),
  c(14, 'Kontrak 2026', '2026-05-01', '2027-04-30', 25 * m, '2026-04-09'),
  c(15, 'Kontrak 2026', '2026-06-01', '2027-05-31', 55 * m, '2026-05-11'),
]

const a = (id: number, schoolId: number, agentId: number, assignedAt: string): MockAssignment => ({ id, schoolId, agentId, sharePercent: 100, assignedAt, unassignedAt: null })
export const initialAssignments: MockAssignment[] = [
  a(1, 1, 1, '2025-01-02'), a(2, 3, 1, '2025-10-01'), a(3, 4, 1, '2026-01-02'), a(4, 6, 1, '2026-07-01'),
  a(5, 2, 2, '2025-01-02'), a(6, 5, 2, '2025-11-01'), a(7, 7, 2, '2026-08-01'), a(8, 13, 2, '2026-02-01'),
  a(9, 8, 3, '2025-09-01'), a(10, 14, 3, '2026-05-01'), a(11, 15, 3, '2026-06-01'),
]

export const initialVisits: MockVisit[] = [
  { id: 2481, schoolId: 4, date: '2026-11-13', agent: 'Dimas Saputra', report: 'Penggunaan LMS kelas 4–6 rutin; kelas 1–3 perlu pelatihan…', durationMinutes: 75 },
  { id: 2455, schoolId: 4, date: '2026-11-03', agent: 'Dimas Saputra', report: 'Pengecekan akun guru baru dan jadwal tryout semester ganjil…', durationMinutes: 55 },
  { id: 2402, schoolId: 4, date: '2026-10-15', agent: 'Dimas Saputra', report: 'Presentasi laporan pemakaian ke kepala sekolah…', durationMinutes: 100 },
]

export const initialChanges: MockSchoolChange[] = [
  { id: 1, schoolId: 4, at: '2026-11-13T10:15:00+07:00', actor: 'Dimas Saputra', actorRole: 'Agent', action: 'Check-out', data: 'Kunjungan #2481', before: 'Berlangsung', after: 'Selesai' },
  { id: 2, schoolId: 4, at: '2026-11-13T09:00:00+07:00', actor: 'Dimas Saputra', actorRole: 'Agent', action: 'Check-in', data: 'Kunjungan #2481', before: null, after: 'Berlangsung' },
  { id: 3, schoolId: 4, at: '2026-11-02T14:22:00+07:00', actor: 'Rina Nurhayati', actorRole: 'Manager', action: 'Ubah', data: 'Sekolah • PIC', before: 'Ibu Ratna', after: 'Bapak Hendra Gunawan' },
  { id: 4, schoolId: 4, at: '2026-01-02T09:10:00+07:00', actor: 'Rina Nurhayati', actorRole: 'Manager', action: 'Tambah', data: 'Penugasan', before: 'Tanpa agent', after: 'Dimas Saputra' },
  { id: 5, schoolId: 4, at: '2025-12-18T11:40:00+07:00', actor: 'Fajar Hidayat', actorRole: 'Admin', action: 'Tambah', data: 'Kontrak 2026', before: null, after: 'Rp 60.000.000' },
  { id: 6, schoolId: 4, at: '2025-09-05T08:30:00+07:00', actor: 'Fajar Hidayat', actorRole: 'Admin', action: 'Impor', data: 'Sekolah (CSV)', before: 'Paket Dasar', after: 'Paket Standar' },
]

// NPSN yang sudah ada di server tetapi tidak tampil di daftar contoh (dipakai pratinjau impor: "diperbarui").
export const extraExistingNpsn: string[] = Array.from({ length: 18 }, (_, i) => `2031${String(1000 + i * 7)}`)

// Target retention per tahun (angka tiruan dari Figma).
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
export const initialTargets: MockTargetYear[] = [
  { year: 2027, targetPercent: 65, isDefault: true, cohortValue: 1_380 * m, signedValue: 0, retention: 0, status: 'NONE' },
  { year: 2026, targetPercent: 65, isDefault: false, cohortValue: 1_240 * m, signedValue: 742 * m, retention: 59.8, status: 'ON_TARGET' },
  { year: 2025, targetPercent: 60, isDefault: false, cohortValue: 1_050 * m, signedValue: 714 * m, retention: 68.0, status: 'ON_TARGET' },
]

export interface MockExportLog { id: number; at: string; actor: string; kind: string; filter: string; rows: number }
export const initialExports: MockExportLog[] = [
  { id: 1, at: '2026-11-14T08:05:00+07:00', actor: 'Rina Nurhayati', kind: 'Rekap kunjungan', filter: '1–7 Nov 2026 • semua agent', rows: 38 },
  { id: 2, at: '2026-11-10T16:40:00+07:00', actor: 'Fajar Hidayat', kind: 'Data sekolah', filter: 'Semua', rows: 15 },
  { id: 3, at: '2026-11-03T09:12:00+07:00', actor: 'Rina Nurhayati', kind: 'Riwayat kontrak', filter: 'Tahun berakhir 2026', rows: 26 },
]

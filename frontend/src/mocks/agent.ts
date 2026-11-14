import type { IndoTimezone } from '@/utils/timezone'

// Data tiruan layar agent. Isinya disamakan dengan desain Figma "02 Agent (HP)".
export type VisitStatus = 'ONGOING' | 'COMPLETED'

export interface Visit {
  id: number
  schoolId: number
  schoolName: string
  checkInAt: string // ISO UTC
  checkOutAt: string | null
  timezone: IndoTimezone
  status: VisitStatus
  report: string | null
  accuracyM?: number | null
  photoUrl?: string | null
}

export interface AgentProfile {
  name: string
  timezone: IndoTimezone
}

export interface MockSchool {
  id: number
  name: string
  npsn: string
  city: string
  assigned: boolean
}
// Urutan sama dengan daftar di Figma (Check-in: pilih sekolah).
export const mockSchools: MockSchool[] = [
  { id: 1, name: 'SMA Bina Insani Bekasi', npsn: '20219874', city: 'Bekasi', assigned: true },
  { id: 3, name: 'SMP Gemilang Bogor', npsn: '20231456', city: 'Bogor', assigned: true },
  { id: 5, name: 'SD Cahaya Ilmu Depok', npsn: '20228801', city: 'Depok', assigned: true },
  { id: 4, name: 'SMK Taruna Jaya Karawang', npsn: '20217735', city: 'Karawang', assigned: true },
  { id: 2, name: 'SMP Nusa Indah Bekasi', npsn: '20219102', city: 'Bekasi', assigned: false },
  { id: 6, name: 'SMA Lentera Jakarta Timur', npsn: '20104417', city: 'Jakarta Timur', assigned: false },
]

export const agentProfile: AgentProfile = { name: 'Dimas Saputra', timezone: 'WIB' }

/** Jam "sekarang" tiruan: Sabtu 14 November 2026 10.40 WIB (supaya "berjalan 1 j 25 m" sama dengan Figma). */
export const MOCK_NOW_ISO = '2026-11-14T03:40:00.000Z'

export const mockVisits: Visit[] = [
  { id: 3, schoolId: 1, schoolName: 'SMA Bina Insani Bekasi', checkInAt: '2026-11-14T02:15:00.000Z', checkOutAt: null, timezone: 'WIB', status: 'ONGOING', report: null, accuracyM: 12 },
  { id: 2, schoolId: 2, schoolName: 'SMP Nusa Indah Bekasi', checkInAt: '2026-11-13T06:05:00.000Z', checkOutAt: '2026-11-13T07:10:00.000Z', timezone: 'WIB', status: 'COMPLETED', report: 'Demo fitur laporan nilai untuk guru kelas 8.' },
  { id: 1, schoolId: 3, schoolName: 'SMP Gemilang Bogor', checkInAt: '2026-11-12T02:30:00.000Z', checkOutAt: '2026-11-12T04:00:00.000Z', timezone: 'WIB', status: 'COMPLETED', report: 'Pendampingan penggunaan LMS oleh wali kelas.' },
]

export interface RetentionSummary {
  year: number
  status: 'on-target' | 'below-target' | 'no-data'
  percent: number // retention tahunan
  targetPercent: number
  signedValue: number
  cohortValue: number
  decidedPercent: number // dasar label status (kontrak yang sudah diputuskan)
}
export const retentionSummary: RetentionSummary = {
  year: 2026, status: 'on-target', percent: 80, targetPercent: 65, signedValue: 248_000_000, cohortValue: 310_000_000, decidedPercent: 88.6,
}

export type PeriodKey = 'day' | 'week' | 'month'
export interface PeriodSummary {
  label: string
  completed: { value: number; previous: number }
  schools: { value: number; previous: number }
  avgDurationMinutes: { value: number; previous: number }
  renewalValue: number | null
  renewalPreviousLabel: string
  assignedVisits: number
  otherVisits: number
}
export const periodSummaries: Record<PeriodKey, PeriodSummary> = {
  week: { label: '9–15 Nov', completed: { value: 9, previous: 7 }, schools: { value: 7, previous: 6 }, avgDurationMinutes: { value: 78, previous: 84 }, renewalValue: 80_000_000, renewalPreviousLabel: 'Minggu lalu: –', assignedVisits: 7, otherVisits: 2 },
  day: { label: '14 Nov', completed: { value: 2, previous: 1 }, schools: { value: 2, previous: 1 }, avgDurationMinutes: { value: 65, previous: 90 }, renewalValue: null, renewalPreviousLabel: 'Kemarin: –', assignedVisits: 2, otherVisits: 0 },
  month: { label: 'Nov 2026', completed: { value: 21, previous: 26 }, schools: { value: 12, previous: 11 }, avgDurationMinutes: { value: 80, previous: 75 }, renewalValue: 120_000_000, renewalPreviousLabel: 'Bulan lalu: Rp 95 jt', assignedVisits: 17, otherVisits: 4 },
}

export interface UnvisitedSchool { schoolId: number; name: string; lastVisit: string }
export const unvisitedSchools: UnvisitedSchool[] = [
  { schoolId: 4, name: 'SMK Taruna Jaya Karawang', lastVisit: '28 Okt 2026' },
  { schoolId: 5, name: 'SD Cahaya Ilmu Depok', lastVisit: '3 Nov 2026' },
]

export interface AttentionContract { schoolId: number; name: string; endLabel: string; valueLabel: string; chip: string; tone: 'error' | 'warning' }
export const attentionContracts: AttentionContract[] = [
  { schoolId: 3, name: 'SMP Gemilang Bogor', endLabel: 'Berakhir 30 Sep 2026', valueLabel: 'Rp 45.000.000', chip: 'Belum diperpanjang', tone: 'error' },
  { schoolId: 5, name: 'SD Cahaya Ilmu Depok', endLabel: 'Berakhir 31 Des 2026', valueLabel: 'Rp 60.000.000', chip: 'Berakhir 47 hari lagi', tone: 'warning' },
]

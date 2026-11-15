import type { Contract } from '@/components/agent/contracts'
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
// Sengaja kosong: sekolah ditugaskan dan kunjungan asli diisi lewat aplikasi (penugasan manager,
// check-in/check-out agent), bukan di-hardcode di sini.
export const mockSchools: MockSchool[] = []

export const agentProfile: AgentProfile = { name: 'Akhmad Mukhibun', timezone: 'WIB' }

/** Jam "sekarang" dev:mock; dulu dibuat tetap supaya cocok Figma. */
export const MOCK_NOW_ISO = new Date().toISOString()

export const mockVisits: Visit[] = []

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
  year: 2026, status: 'no-data', percent: 0, targetPercent: 65, signedValue: 0, cohortValue: 0, decidedPercent: 0,
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
const emptySummary = (label: string): PeriodSummary => ({ label, completed: { value: 0, previous: 0 }, schools: { value: 0, previous: 0 }, avgDurationMinutes: { value: 0, previous: 0 }, renewalValue: null, renewalPreviousLabel: '–: –', assignedVisits: 0, otherVisits: 0 })
export const periodSummaries: Record<PeriodKey, PeriodSummary> = {
  week: emptySummary('Minggu ini'),
  day: emptySummary('Hari ini'),
  month: emptySummary('Bulan ini'),
}

export interface UnvisitedSchool { schoolId: number; name: string; lastVisit: string }
export const unvisitedSchools: UnvisitedSchool[] = []

export interface AttentionContract { schoolId: number; name: string; endLabel: string; valueLabel: string; chip: string; tone: 'error' | 'warning' }
export const attentionContracts: AttentionContract[] = []

export interface SchoolDetail {
  id: number
  level: string
  packageName: string
  timezone: IndoTimezone
  lmsId: string | null
  address: string
  pic: string
  picPhone: string
  startedAt: string // yyyy-mm-dd
  onboardingAt: string
  activeAt: string
  endsAt: string
  lastVisitAt: string | null // dasar "terakhir dikunjungi" bila belum ada kunjungan di state
  contracts: Contract[]
}

// Sengaja kosong: detail sekolah asli dipetakan dari mockSchools begitu ada data sekolah/kontrak.
export const mockSchoolDetails: SchoolDetail[] = []

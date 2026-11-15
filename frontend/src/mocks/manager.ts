// Data tiruan layar manager. Isinya disamakan dengan desain Figma "03 Manager" (hari ini = 14 Nov 2026).
import type { IndoTimezone } from '@/utils/timezone'

export type AgentActiveState = 'ACTIVE' | 'INACTIVE'

export interface MockAgent {
  id: number
  name: string
  email: string
  timezone: IndoTimezone
  schoolCount: number
  active: boolean
  lastLoginLabel: string
}

export interface MockSchoolRef {
  id: number
  name: string
  agentId: number | null // agent yang ditugaskan; null = tidak ditugaskan
  lat: number
  lng: number
}

export interface MockManagerVisit {
  id: number
  agentId: number
  schoolId: number
  checkInAt: string // ISO UTC
  checkOutAt: string | null
  timezone: IndoTimezone // disalin dari zona agent saat check-in
  ongoingMinutes?: number // durasi tampilan untuk kunjungan berlangsung (jam "server" tiruan)
  report: string | null
  accuracyM: number
}

export const initialAgents: MockAgent[] = []

export const mockSchools: MockSchoolRef[] = []

const OFFSET: Record<IndoTimezone, number> = { WIB: 7, WITA: 8, WIT: 9 }
void OFFSET

/** Jam dinding di zona agent ("09.15") menjadi ISO UTC. Disisakan untuk saat data asli diisi. */
function at(dateKey: string, clock: string, tz: IndoTimezone): string {
  const [h, m] = clock.split('.').map(Number)
  const [y, mo, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y!, mo! - 1, d!, h! - OFFSET[tz], m!)).toISOString()
}
void at

// Sengaja kosong: kunjungan asli diisi lewat check-in/check-out agent di aplikasi, bukan di sini.
export const initialVisits: MockManagerVisit[] = []


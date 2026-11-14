// Lapisan layanan manager. Sekarang membaca data tiruan dalam memori; nanti diganti panggilan API
// tanpa mengubah layar yang membacanya.
import { initialAgents, initialVisits, mockSchools, type MockAgent, type MockManagerVisit, type MockSchoolRef } from '@/mocks/manager'
import { MOCK_AUTH } from '@/stores/session'
import { api } from './http'
import { lastLoginLabel } from './admin.api'
import { wibDateKey, type IndoTimezone } from '@/utils/timezone'

export type VisitStatusKey = 'ONGOING' | 'COMPLETED'

export interface VisitRow {
  id: number
  dateKey: string // yyyy-mm-dd menurut WIB
  dayLabel: string // Sabtu
  dateLabel: string // 14 Nov 2026
  agentId: number
  agentName: string
  schoolId: number
  schoolName: string
  assigned: boolean
  timezone: IndoTimezone
  checkInAt: string
  checkOutAt: string | null
  durationMinutes: number
  status: VisitStatusKey
  report: string | null
  accuracyM: number
  lat: number
  lng: number
}

export interface VisitFilter { from: string | null; to: string | null; agentId: number | null; schoolId: number | null; status: VisitStatusKey | null }

let agents: MockAgent[] = initialAgents.map((a) => ({ ...a }))
const visits: MockManagerVisit[] = initialVisits

const idFmt = (opts: Intl.DateTimeFormatOptions, d: string) => new Intl.DateTimeFormat('id-ID', { ...opts, timeZone: 'Asia/Jakarta' }).format(new Date(d))

function toRow(v: MockManagerVisit): VisitRow {
  const agent = agents.find((a) => a.id === v.agentId)!
  const school: MockSchoolRef = mockSchools.find((s) => s.id === v.schoolId)!
  const minutes = v.checkOutAt ? (new Date(v.checkOutAt).getTime() - new Date(v.checkInAt).getTime()) / 60000 : (v.ongoingMinutes ?? 0)
  return {
    id: v.id,
    dateKey: wibDateKey(v.checkInAt),
    dayLabel: idFmt({ weekday: 'long' }, v.checkInAt),
    dateLabel: idFmt({ day: 'numeric', month: 'short', year: 'numeric' }, v.checkInAt),
    agentId: agent.id, agentName: agent.name,
    schoolId: school.id, schoolName: school.name, assigned: school.agentId === agent.id,
    timezone: v.timezone, checkInAt: v.checkInAt, checkOutAt: v.checkOutAt,
    durationMinutes: minutes, status: v.checkOutAt ? 'COMPLETED' : 'ONGOING',
    report: v.report, accuracyM: v.accuracyM, lat: school.lat, lng: school.lng,
  }
}

/** Filter murni: dipakai layanan dan tes unit. Tanggal dibanding sebagai yyyy-mm-dd menurut WIB. */
export function filterVisits(rows: VisitRow[], f: VisitFilter): VisitRow[] {
  return rows.filter(
    (r) =>
      (!f.from || r.dateKey >= f.from) && (!f.to || r.dateKey <= f.to) &&
      (!f.agentId || r.agentId === f.agentId) && (!f.schoolId || r.schoolId === f.schoolId) && (!f.status || r.status === f.status),
  )
}

export async function listVisits(filter: VisitFilter): Promise<VisitRow[]> {
  return filterVisits(visits.map(toRow), filter)
}

export async function getVisit(id: number): Promise<VisitRow | null> {
  const v = visits.find((x) => x.id === id)
  return v ? toRow(v) : null
}

export function listAgentOptions(): { id: number; name: string }[] {
  return agents.map((a) => ({ id: a.id, name: a.name }))
}
export function listSchoolOptions(): { id: number; name: string }[] {
  return [...mockSchools].sort((a, b) => a.name.localeCompare(b.name, 'id')).map((s) => ({ id: s.id, name: s.name }))
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export interface AgentInput { name: string; timezone: IndoTimezone; active: boolean }
export interface AgentFilter { query: string; status: 'ACTIVE' | 'INACTIVE' | null }

async function listAgentsApi(filter: AgentFilter): Promise<MockAgent[]> {
  const qs = new URLSearchParams({ role: 'AGENT' })
  if (filter.query.trim()) qs.set('query', filter.query.trim())
  if (filter.status) qs.set('status', filter.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE')
  const { items } = await api<{ items: { id: number; name: string; email: string; timezone: IndoTimezone; status: string; lastLoginAt: string | null }[] }>(`/users?${qs}`)
  // "Aktif" di filter UI mencakup akun yang belum login pertama.
  const all = filter.status === 'ACTIVE'
    ? [...items, ...(await api<{ items: typeof items }>(`/users?role=AGENT&status=MUST_CHANGE_PASSWORD${filter.query.trim() ? `&query=${encodeURIComponent(filter.query.trim())}` : ''}`)).items]
    : items
  // schoolCount menunggu penugasan (B6)
  return all.map((a) => ({ id: a.id, name: a.name, email: a.email, timezone: a.timezone, schoolCount: 0, active: a.status !== 'INACTIVE', lastLoginLabel: lastLoginLabel(a.lastLoginAt) }))
}

export async function listAgents(filter: AgentFilter): Promise<MockAgent[]> {
  if (!MOCK_AUTH) return listAgentsApi(filter)
  const q = filter.query.trim().toLowerCase()
  return agents
    .filter((a) => (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) && (!filter.status || a.active === (filter.status === 'ACTIVE')))
    .map((a) => ({ ...a }))
}

/** Manager hanya boleh mengubah nama, zona waktu, dan status aktif akun berperan agent. */
export async function updateAgent(id: number, input: AgentInput): Promise<void> {
  if (!MOCK_AUTH) {
    await api(`/users/${id}`, { method: 'PATCH', body: { name: input.name, timezone: input.timezone, isActive: input.active } })
    return
  }
  agents = agents.map((a) => (a.id === id ? { ...a, name: input.name.trim(), timezone: input.timezone, active: input.active } : a))
}

export function validateAgentInput(input: { name: string; timezone: string | null }): { name: string; timezone: string } {
  return {
    name: !input.name.trim() ? 'Nama wajib diisi' : input.name.trim().length > 100 ? 'Nama maksimal 100 karakter' : '',
    timezone: !input.timezone ? 'Zona waktu wajib dipilih' : '',
  }
}

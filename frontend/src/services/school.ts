// Lapisan layanan sekolah. Sekarang data tiruan di memori; nanti diganti panggilan API tanpa mengubah layar.
import { currentContract, renewalOf, renewalStatus, type RenewalStatus } from '@/components/school/contract-rules'
import { asZone, type ImportRow } from '@/components/school/import-rules'
import { formatRupiah } from '@/utils/format'
import {
  agents, extraExistingNpsn, initialAssignments, initialChanges, initialContracts, initialExports, initialSchools, initialTargets,
  initialVisits, MOCK_TODAY, type Level, type MockAgent, type MockAssignment, type MockContract, type MockExportLog, type MockSchool,
  type MockSchoolChange, type MockTargetYear, type MockVisit, type Pkg,
} from '@/mocks/school'
import type { IndoTimezone } from '@/utils/timezone'

let schools: MockSchool[] = initialSchools.map((x) => ({ ...x }))
let contracts: MockContract[] = initialContracts.map((x) => ({ ...x }))
let assignments: MockAssignment[] = initialAssignments.map((x) => ({ ...x }))
let changes: MockSchoolChange[] = initialChanges.map((x) => ({ ...x }))
let targets: MockTargetYear[] = initialTargets.map((x) => ({ ...x }))
let exportsLog: MockExportLog[] = initialExports.map((x) => ({ ...x }))
const visits: MockVisit[] = initialVisits

/** Satu konstanta untuk batas agent aktif per sekolah (MVP: 1). */
export const MAX_AGENTS_PER_SCHOOL = 1
const ACTOR = { name: 'Rina Nurhayati', role: 'Manager' as const }

function log(schoolId: number, action: MockSchoolChange['action'], data: string, before: string | null, after: string) {
  changes = [{ id: Math.max(0, ...changes.map((c) => c.id)) + 1, schoolId, at: new Date().toISOString(), actor: ACTOR.name, actorRole: ACTOR.role, action, data, before, after }, ...changes]
}

export const listAgents = (): MockAgent[] => agents
export const agentName = (id: number | null) => agents.find((a) => a.id === id)?.name ?? null

const activeAssignment = (schoolId: number) => assignments.find((a) => a.schoolId === schoolId && !a.unassignedAt)

export interface SchoolRow {
  school: MockSchool
  contract: MockContract | undefined
  status: RenewalStatus | null
  agent: MockAgent | null
}
export interface SchoolFilter {
  query: string
  level: string | null
  pkg: string | null
  status: string | null // RENEWED | EXPIRED | ENDING_SOON | RUNNING
  agent: string | null // id agent atau 'NONE'
}

function buildRow(school: MockSchool): SchoolRow {
  const own = contracts.filter((c) => c.schoolId === school.id)
  const assign = activeAssignment(school.id)
  return { school, contract: currentContract(own), status: renewalStatus(own), agent: agents.find((a) => a.id === assign?.agentId) ?? null }
}

export async function listSchools(filter: SchoolFilter): Promise<SchoolRow[]> {
  const q = filter.query.trim().toLowerCase()
  return schools.map(buildRow).filter(
    (r) =>
      (!q || r.school.name.toLowerCase().includes(q) || r.school.npsn.includes(q)) &&
      (!filter.level || r.school.level === filter.level) &&
      (!filter.pkg || r.school.pkg === filter.pkg) &&
      (!filter.status || r.status?.kind === filter.status) &&
      (!filter.agent || (filter.agent === 'NONE' ? !r.agent : String(r.agent?.id) === filter.agent)),
  )
}

export interface SchoolDetail {
  row: SchoolRow
  contracts: MockContract[]
  visits: MockVisit[]
  changes: MockSchoolChange[]
  assignment: MockAssignment | null
}
export async function getSchool(id: number): Promise<SchoolDetail | null> {
  const school = schools.find((x) => x.id === id)
  if (!school) return null
  return {
    row: buildRow(school),
    contracts: contracts.filter((c) => c.schoolId === id).sort((a, b) => b.end.localeCompare(a.end)),
    visits: visits.filter((v) => v.schoolId === id),
    changes: changes.filter((c) => c.schoolId === id).sort((a, b) => b.at.localeCompare(a.at)),
    assignment: activeAssignment(id) ?? null,
  }
}

export const npsnOwner = (npsn: string): MockSchool | undefined => schools.find((s) => s.npsn === npsn.trim())

export interface SchoolInput {
  name: string; npsn: string; lmsSchoolId: number | null; city: string; level: Level; pkg: Pkg; timezone: IndoTimezone
  pic: string; picContact: string; address: string
  coopStart: string; onboarding: string | null; activeUse: string | null; coopEnd: string
  contract: { signedDate: string; start: string; end: string; value: number; note: string }
  agentId: number | null
}

function insertSchool(input: Omit<SchoolInput, 'agentId' | 'contract'>, c: SchoolInput['contract'], source: 'manual' | 'csv'): MockSchool {
  const created: MockSchool = {
    id: Math.max(0, ...schools.map((s) => s.id)) + 1, npsn: input.npsn.trim(), name: input.name.trim(), lmsSchoolId: input.lmsSchoolId,
    level: input.level, pkg: input.pkg, timezone: input.timezone, city: input.city.trim(), address: input.address.trim(),
    pic: input.pic.trim(), picContact: input.picContact.trim(), coopStart: input.coopStart, onboarding: input.onboarding,
    activeUse: input.activeUse, coopEnd: input.coopEnd,
  }
  schools = [...schools, created]
  const label = `Kontrak ${c.start.slice(0, 4)}`
  contracts = [...contracts, {
    id: Math.max(0, ...contracts.map((x) => x.id)) + 1, schoolId: created.id, label, start: c.start, end: c.end, value: c.value,
    signedDate: c.signedDate, type: 'FIRST', previousContractId: null, note: c.note,
  }]
  log(created.id, source === 'csv' ? 'Impor' : 'Tambah', source === 'csv' ? 'Sekolah (CSV)' : 'Sekolah', null, created.name)
  log(created.id, 'Tambah', label, null, formatRupiah(c.value))
  return created
}

export async function createSchool(input: SchoolInput): Promise<MockSchool> {
  if (npsnOwner(input.npsn)) throw new Error('NPSN sudah dipakai')
  const { agentId, contract, ...data } = input
  const created = insertSchool(data, contract, 'manual')
  if (agentId) await assignSchool(created.id, agentId)
  return created
}

export interface RenewalSave { signedDate: string; start: string; end: string; value: number; note: string }
export async function addRenewal(schoolId: number, baseContractId: number, input: RenewalSave): Promise<MockContract> {
  const base = contracts.find((c) => c.id === baseContractId && c.schoolId === schoolId)
  if (!base) throw new Error('Kontrak tidak ditemukan')
  if (renewalOf(base, contracts)) throw new Error('Kontrak ini sudah punya perpanjangan')
  const created: MockContract = {
    id: Math.max(0, ...contracts.map((c) => c.id)) + 1, schoolId, label: `Kontrak ${input.start.slice(0, 4)}`, start: input.start,
    end: input.end, value: input.value, signedDate: input.signedDate, type: 'RENEWAL', previousContractId: base.id, note: input.note,
  }
  contracts = [...contracts, created]
  log(schoolId, 'Tambah', `${created.label} (perpanjangan)`, null, formatRupiah(input.value))
  return created
}

// Penugasan: satu agent aktif per sekolah (MAX_AGENTS_PER_SCHOOL). Pindah = tutup baris lama + buat baris baru.
export interface AgentSummary { agent: MockAgent; rows: { assignment: MockAssignment; row: SchoolRow }[] }
export async function listAssignmentsByAgent(): Promise<{ perAgent: AgentSummary[]; unassigned: SchoolRow[] }> {
  const perAgent = agents.map((agent) => ({
    agent,
    rows: assignments.filter((a) => a.agentId === agent.id && !a.unassignedAt).map((assignment) => ({ assignment, row: buildRow(schools.find((s) => s.id === assignment.schoolId)!) })),
  }))
  const unassigned = schools.filter((s) => !activeAssignment(s.id)).map(buildRow)
  return { perAgent, unassigned }
}

export async function assignSchool(schoolId: number, agentId: number): Promise<void> {
  const school = schools.find((s) => s.id === schoolId)
  const agent = agents.find((a) => a.id === agentId)
  if (!school || !agent) throw new Error('Data tidak ditemukan')
  const current = assignments.filter((a) => a.schoolId === schoolId && !a.unassignedAt)
  const before = current[0] ? agentName(current[0].agentId) : null
  if (current.length && current[0]?.agentId === agentId) return
  if (current.length >= MAX_AGENTS_PER_SCHOOL) {
    assignments = assignments.map((a) => (a.schoolId === schoolId && !a.unassignedAt ? { ...a, unassignedAt: MOCK_TODAY } : a))
  }
  assignments = [...assignments, { id: Math.max(0, ...assignments.map((a) => a.id)) + 1, schoolId, agentId, sharePercent: 100, assignedAt: MOCK_TODAY, unassignedAt: null }]
  log(schoolId, 'Tambah', 'Penugasan', before ?? 'Tanpa agent', agent.name)
}

export const assignmentHistory = (schoolId: number) => assignments.filter((a) => a.schoolId === schoolId).sort((a, b) => b.id - a.id)

// Target retention per tahun
export async function listTargets(): Promise<MockTargetYear[]> {
  return targets.map((t) => ({ ...t })).sort((a, b) => b.year - a.year)
}
export async function saveTarget(year: number, percent: number): Promise<void> {
  if (!(percent > 0 && percent <= 100)) throw new Error('Persentase target harus lebih dari 0 dan paling banyak 100')
  targets = targets.map((t) => (t.year === year ? { ...t, targetPercent: percent, isDefault: false } : t))
}

// Impor
export const existingNpsnSet = (): Set<string> => new Set([...schools.map((s) => s.npsn), ...extraExistingNpsn])
export async function commitImport(rows: ImportRow[]): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0
  for (const r of rows.filter((x) => x.ok)) {
    const existing = schools.find((s) => s.npsn === r.npsn)
    if (existing) {
      schools = schools.map((s) => (s.id === existing.id ? { ...s, address: r.address || s.address, pic: r.pic || s.pic, picContact: r.picContact || s.picContact } : s))
      log(existing.id, 'Impor', 'Sekolah (CSV)', null, 'Diperbarui')
      updated++
    } else if (!extraExistingNpsn.includes(r.npsn)) {
      insertSchool({
        name: r.name, npsn: r.npsn, lmsSchoolId: r.lmsId ? Number(r.lmsId) : null, city: r.city, level: r.level as Level, pkg: r.pkg as Pkg,
        timezone: asZone(r.timezone), pic: r.pic, picContact: r.picContact, address: r.address, coopStart: r.start, onboarding: null, activeUse: null, coopEnd: r.end,
      }, { signedDate: r.signed, start: r.start, end: r.end, value: r.value, note: '' }, 'csv')
      created++
    } else updated++
  }
  return { created, updated }
}

// Ekspor
export async function listExports(): Promise<MockExportLog[]> {
  return [...exportsLog]
}
export async function addExportLog(kind: string, filter: string, rows: number): Promise<void> {
  exportsLog = [{ id: Math.max(0, ...exportsLog.map((e) => e.id)) + 1, at: new Date().toISOString(), actor: ACTOR.name, kind, filter, rows }, ...exportsLog]
}
export const allContracts = () => contracts.map((c) => ({ ...c }))
export const allVisits = () => visits.map((v) => ({ ...v }))

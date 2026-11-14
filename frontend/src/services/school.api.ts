// Layanan sekolah lewat API sungguhan (bentuk keluaran sama dengan school.mock.ts).
import { renewalOf } from '@/components/school/contract-rules'
import type { ChangeAction, MockAgent, MockAssignment, MockContract, MockSchool, MockSchoolChange, MockTargetYear } from '@/mocks/school'
import { pinia } from '@/plugins/pinia'
import { useReferenceStore } from '@/stores/reference'
import type { IndoTimezone } from '@/utils/timezone'
import { api } from './http'
import type { AgentSummary, RenewalSave, SchoolDetail, SchoolFilter, SchoolInput, SchoolRow } from './school.mock'

interface ApiContract { id: number; type: 'NEW' | 'RENEWAL'; previousContractId: number | null; signedDate: string | null; start: string; end: string; value: number; note: string | null }
interface ApiSummary {
  id: number; npsn: string; name: string; lmsSchoolId: number | null; city: string | null; timezone: IndoTimezone
  jenjang: { id: number; name: string }; package: { id: number; name: string }
  agent: { id: number; name: string; sharePercent: number; assignmentId: number; assignedAt: string } | null
  contract: ApiContract | null; status: { kind: 'RENEWED' | 'EXPIRED' | 'ENDING_SOON' | 'RUNNING'; daysLeft: number } | null
}
interface ApiDetailSchool extends ApiSummary {
  address: string | null; picName: string | null; picContact: string | null
  partnershipStartDate: string | null; onboardingDate: string | null; activeSinceDate: string | null; partnershipEndDate: string | null
}

const ref = () => useReferenceStore(pinia)
export const listAgents = (): MockAgent[] => ref().agents
const agentOf = (a: ApiSummary['agent']): MockAgent | null => (a ? (ref().agents.find((x) => x.id === a.id) ?? { id: a.id, name: a.name, timezone: 'WIB', retention2026: 0 }) : null)

const toContract = (c: ApiContract): MockContract => ({
  id: c.id, schoolId: 0, label: `Kontrak ${c.start.slice(0, 4)}`, start: c.start, end: c.end, value: c.value,
  signedDate: c.signedDate ?? '', type: c.type === 'NEW' ? 'FIRST' : 'RENEWAL', previousContractId: c.previousContractId, note: c.note ?? '',
})
const toSchool = (s: ApiSummary | ApiDetailSchool): MockSchool => {
  const d = s as Partial<ApiDetailSchool>
  return {
    id: s.id, lmsSchoolId: s.lmsSchoolId, npsn: s.npsn, name: s.name, level: s.jenjang.name as MockSchool['level'], pkg: s.package.name as MockSchool['pkg'],
    timezone: s.timezone, city: s.city ?? '', address: d.address ?? '', pic: d.picName ?? '', picContact: d.picContact ?? '',
    coopStart: d.partnershipStartDate ?? '', onboarding: d.onboardingDate ?? null, activeUse: d.activeSinceDate ?? null, coopEnd: d.partnershipEndDate ?? s.contract?.end ?? '',
  }
}
const toRow = (s: ApiSummary | ApiDetailSchool): SchoolRow => ({ school: toSchool(s), contract: s.contract ? { ...toContract(s.contract), schoolId: s.id } : undefined, status: s.status, agent: agentOf(s.agent) })

const idByName = (items: { id: number; name: string }[], name: string | null) => items.find((i) => i.name === name)?.id

let npsnCache = new Map<string, string>()

export async function listSchools(f: SchoolFilter): Promise<SchoolRow[]> {
  const qs = new URLSearchParams({ pageSize: '200' })
  if (f.query.trim()) qs.set('query', f.query.trim())
  const lv = idByName(ref().levels, f.level); if (lv) qs.set('jenjangId', String(lv))
  const pk = idByName(ref().packages, f.pkg); if (pk) qs.set('packageId', String(pk))
  if (f.status) qs.set('status', f.status)
  if (f.agent) qs.set('agentId', f.agent)
  const { items } = await api<{ items: ApiSummary[] }>(`/schools?${qs}`)
  items.forEach((s) => npsnCache.set(s.npsn, s.name))
  return items.map(toRow)
}

const CHANGE_DATA: Record<string, string> = { school: 'Sekolah', contract: 'Kontrak', assignment: 'Penugasan' }
interface ApiChange { id: number; at: string; action: string; entityType: string; actor: string | null; actorRole: 'ADMIN' | 'MANAGER' | 'AGENT' | null; changes: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null }
const ROLE = { ADMIN: 'Admin', MANAGER: 'Manager', AGENT: 'Agent' } as const
const show = (v: unknown) => (v === undefined || v === null || v === '' ? null : String(v))

function toChanges(schoolId: number, items: ApiChange[]): MockSchoolChange[] {
  return items.flatMap((c) => {
    const base = { schoolId, at: c.at, actor: c.actor ?? 'Tidak dikenal', actorRole: ROLE[c.actorRole ?? 'AGENT'] }
    const action: ChangeAction = c.action === 'UPDATE' || c.action === 'UNASSIGN' ? 'Ubah' : c.action === 'IMPORT' ? 'Impor' : 'Tambah'
    const data = CHANGE_DATA[c.entityType] ?? c.entityType
    const after = c.changes?.after
    if (c.action === 'UPDATE' && after) {
      return Object.keys(after).filter((k) => show(c.changes?.before?.[k]) !== show(after[k])).map((k, i) => ({ ...base, id: c.id * 100 + i, action, data: k, before: show(c.changes?.before?.[k]), after: show(after[k]) ?? '—' }))
    }
    const summary = c.entityType === 'assignment' ? String(after?.agentId ?? '') : c.entityType === 'contract' ? (after?.value ? `Rp ${Number(after.value).toLocaleString('id-ID')}` : '') : String(after?.name ?? '')
    return [{ ...base, id: c.id * 100, action, data, before: null, after: summary || '—' }]
  })
}

export async function getSchool(id: number): Promise<SchoolDetail | null> {
  try {
    const d = await api<{ school: ApiDetailSchool; contracts: ApiContract[]; assignments: { id: number; agentId: number; sharePercent: number; assignedAt: string; unassignedAt: string | null }[] }>(`/schools/${id}`)
    let changes: MockSchoolChange[] = []
    try { changes = toChanges(id, (await api<{ items: ApiChange[] }>(`/schools/${id}/changes`)).items) } catch { /* AGENT tidak berhak; tab disembunyikan */ }
    const active = d.assignments.find((a) => !a.unassignedAt)
    const assignment: MockAssignment | null = active ? { id: active.id, schoolId: id, agentId: active.agentId, sharePercent: active.sharePercent, assignedAt: active.assignedAt, unassignedAt: null } : null
    return { row: toRow(d.school), contracts: d.contracts.map((c) => ({ ...toContract(c), schoolId: id })), visits: [], changes, assignment }
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null
    throw e
  }
}

export const npsnOwner = (npsn: string): MockSchool | undefined => {
  const name = npsnCache.get(npsn.trim())
  return name ? ({ name } as MockSchool) : undefined
}

export async function createSchool(input: SchoolInput): Promise<MockSchool> {
  const body = {
    name: input.name, npsn: input.npsn.trim(), lmsSchoolId: input.lmsSchoolId, city: input.city, address: input.address, picName: input.pic, picContact: input.picContact,
    jenjangId: idByName(ref().levels, input.level), packageId: idByName(ref().packages, input.pkg), timezone: input.timezone,
    partnershipStartDate: input.coopStart, onboardingDate: input.onboarding, activeSinceDate: input.activeUse, partnershipEndDate: input.coopEnd || null,
    contract: { signedDate: input.contract.signedDate || null, start: input.contract.start, end: input.contract.end, value: input.contract.value, note: input.contract.note || null },
    agentId: input.agentId,
  }
  const d = await api<{ school: ApiDetailSchool }>('/schools', { method: 'POST', body })
  return toSchool(d.school)
}

export async function addRenewal(schoolId: number, baseContractId: number, input: RenewalSave): Promise<MockContract> {
  const d = await api<{ contracts: ApiContract[] }>(`/schools/${schoolId}/contracts`, {
    method: 'POST', body: { previousContractId: baseContractId, signedDate: input.signedDate, start: input.start, end: input.end, value: input.value, note: input.note || null },
  })
  const created = d.contracts.find((c) => c.previousContractId === baseContractId)!
  return { ...toContract(created), schoolId }
}

export async function listAssignmentsByAgent(): Promise<{ perAgent: AgentSummary[]; unassigned: SchoolRow[] }> {
  const d = await api<{ agents: { id: number; name: string; timezone: IndoTimezone; retention: number; schools: ApiSummary[] }[]; unassigned: ApiSummary[] }>('/assignments')
  return {
    perAgent: d.agents.map((a) => ({
      agent: { id: a.id, name: a.name, timezone: a.timezone, retention2026: a.retention },
      rows: a.schools.map((s) => ({
        assignment: { id: s.agent!.assignmentId, schoolId: s.id, agentId: a.id, sharePercent: s.agent!.sharePercent, assignedAt: s.agent!.assignedAt, unassignedAt: null },
        row: toRow(s),
      })),
    })),
    unassigned: d.unassigned.map(toRow),
  }
}

export async function assignSchool(schoolId: number, agentId: number): Promise<void> {
  await api(`/schools/${schoolId}/assignment`, { method: 'PUT', body: { agentId } })
}

export async function listTargets(): Promise<MockTargetYear[]> {
  return (await api<{ items: MockTargetYear[] }>('/retention-targets')).items
}
export async function saveTarget(year: number, percent: number): Promise<void> {
  await api(`/retention-targets/${year}`, { method: 'PUT', body: { targetPercent: percent } })
}

export async function listExports(): Promise<import('@/mocks/school').MockExportLog[]> {
  return (await api<{ items: import('@/mocks/school').MockExportLog[] }>('/export/log')).items
}

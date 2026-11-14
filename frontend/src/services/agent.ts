import type { Contract } from '@/components/agent/contracts'
import { pinia } from '@/plugins/pinia'
import { MOCK_AUTH, useSessionStore } from '@/stores/session'
import { api } from './http'
import type { MockSchool as AgentSchool, RetentionSummary } from '@/mocks/agent'
import { agentProfile, attentionContracts, mockSchoolDetails, mockSchools, periodSummaries, retentionSummary, unvisitedSchools } from '@/mocks/agent'
import type { PeriodKey, SchoolDetail } from '@/mocks/agent'

// Mode API: data sekolah agent dimuat sekali setelah login (loadAgentData) lalu dibaca sinkron oleh layar.
interface AgentDetail extends SchoolDetail { name: string; npsn: string; city: string; assigned: boolean }
const cache: { schools: AgentSchool[]; details: Map<number, AgentDetail> } = { schools: [], details: new Map() }

interface ApiSchoolDetail {
  school: { id: number; name: string; npsn: string; city: string | null; timezone: SchoolDetail['timezone']; lmsSchoolId: number | null; jenjang: { name: string }; package: { name: string }; address: string | null; picName: string | null; picContact: string | null; partnershipStartDate: string | null; onboardingDate: string | null; activeSinceDate: string | null; partnershipEndDate: string | null; contract: { end: string } | null }
  contracts: { id: number; type: 'NEW' | 'RENEWAL'; previousContractId: number | null; signedDate: string | null; start: string; end: string; value: number }[]
}

export async function loadAgentData(): Promise<void> {
  const { items } = await api<{ items: AgentSchool[] }>('/schools/options')
  cache.schools = items
  const details = await Promise.all(items.filter((s) => s.assigned).map((s) => api<ApiSchoolDetail>(`/schools/${s.id}`)))
  cache.details = new Map(details.map(({ school: d, contracts }) => [d.id, {
    id: d.id, name: d.name, npsn: d.npsn, city: d.city ?? '', assigned: true, level: d.jenjang.name, packageName: d.package.name, timezone: d.timezone,
    lmsId: d.lmsSchoolId ? String(d.lmsSchoolId) : null, address: d.address ?? '', pic: d.picName ?? '', picPhone: d.picContact ?? '',
    startedAt: d.partnershipStartDate ?? '', onboardingAt: d.onboardingDate ?? '', activeAt: d.activeSinceDate ?? '', endsAt: d.partnershipEndDate ?? d.contract?.end ?? '', lastVisitAt: null,
    contracts: contracts.map((c): Contract => ({ id: c.id, title: `${c.type === 'RENEWAL' ? 'Perpanjangan' : 'Kontrak'} ${c.start.slice(0, 4)}`, startDate: c.start, endDate: c.end, value: c.value, ...(c.previousContractId ? { previousContractId: c.previousContractId } : {}), ...(c.signedDate ? { signedDate: c.signedDate } : {}) })),
  }]))
}

// Ringkasan beranda (periode, retention, perlu perhatian) baru tersedia di B8; sementara kosong di mode API.
const EMPTY_RETENTION: RetentionSummary = { year: new Date().getFullYear(), status: 'no-data', percent: 0, targetPercent: 65, signedValue: 0, cohortValue: 0, decidedPercent: 0 }
const EMPTY_PERIOD = { label: '', completed: { value: 0, previous: 0 }, schools: { value: 0, previous: 0 }, avgDurationMinutes: { value: 0, previous: 0 }, renewalValue: null, renewalPreviousLabel: '', assignedVisits: 0, otherVisits: 0 }

// Lapisan layanan agent. Sekarang mengembalikan data tiruan; nanti diganti panggilan API.
// Hak akses: nilai kontrak dan retention hanya untuk sekolah yang ditugaskan (dicek ulang di backend nanti).
const mockService = {
  schools: () => mockSchools,
  profile: () => agentProfile,
  retention: () => retentionSummary,
  periodSummary: (key: PeriodKey) => periodSummaries[key],
  unvisitedSchools: () => unvisitedSchools,
  attentionContracts: () => attentionContracts,
  assignedSchoolIds: () => mockSchools.filter((s) => s.assigned).map((s) => s.id),
  isAssigned: (schoolId: number) => mockSchools.some((s) => s.id === schoolId && s.assigned),
  /** Detail sekolah; `contracts` dikosongkan bila sekolah tidak ditugaskan kepada agent. */
  schoolDetail(schoolId: number): (SchoolDetail & { name: string; npsn: string; city: string; assigned: boolean }) | null {
    const base = mockSchools.find((s) => s.id === schoolId)
    const detail = mockSchoolDetails.find((d) => d.id === schoolId)
    if (!base || !detail) return null
    return { ...detail, name: base.name, npsn: base.npsn, city: base.city, assigned: base.assigned, contracts: base.assigned ? detail.contracts : [] }
  },
}

const apiService: typeof mockService = {
  schools: () => cache.schools,
  profile: () => { const u = useSessionStore(pinia).user; return { name: u?.name ?? '', timezone: u?.timezone ?? 'WIB' } },
  retention: () => EMPTY_RETENTION,
  periodSummary: () => EMPTY_PERIOD,
  unvisitedSchools: () => [],
  attentionContracts: () => [],
  assignedSchoolIds: () => cache.schools.filter((s) => s.assigned).map((s) => s.id),
  isAssigned: (id) => cache.schools.some((s) => s.id === id && s.assigned),
  schoolDetail: (id) => cache.details.get(id) ?? null,
}

export const agentService = MOCK_AUTH ? mockService : apiService

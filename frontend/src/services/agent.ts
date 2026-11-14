import { agentProfile, attentionContracts, mockSchoolDetails, mockSchools, periodSummaries, retentionSummary, unvisitedSchools } from '@/mocks/agent'
import type { PeriodKey, SchoolDetail } from '@/mocks/agent'

// Lapisan layanan agent. Sekarang mengembalikan data tiruan; nanti diganti panggilan API.
// Hak akses: nilai kontrak dan retention hanya untuk sekolah yang ditugaskan (dicek ulang di backend nanti).
export const agentService = {
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

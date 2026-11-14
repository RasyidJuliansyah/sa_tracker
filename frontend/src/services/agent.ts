import { agentProfile, mockSchools, attentionContracts, periodSummaries, retentionSummary, unvisitedSchools } from '@/mocks/agent'
import type { PeriodKey } from '@/mocks/agent'

// Lapisan layanan agent. Sekarang mengembalikan data tiruan; nanti diganti panggilan API.
export const agentService = {
  schools: () => mockSchools,
  profile: () => agentProfile,
  retention: () => retentionSummary,
  periodSummary: (key: PeriodKey) => periodSummaries[key],
  unvisitedSchools: () => unvisitedSchools,
  attentionContracts: () => attentionContracts,
}

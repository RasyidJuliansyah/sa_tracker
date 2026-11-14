// Lapisan layanan Dashboard manager. Sekarang membaca data tiruan; nanti diganti panggilan API.
import { listVisits, type VisitRow } from '@/services/manager'
import { chartFor, annualRetention, attentionItems, dashAgents, periodStats, unvisitedSchools, type ChartData, type ChartTab, type DashAgent, type PeriodStats, type UnvisitedSchool } from '@/mocks/dashboard'
import { inRange, type PeriodKey, type PeriodRange } from '@/components/dashboard/period'

/** agentIds kosong = semua agent */
const pick = <T extends { agentId?: number; id?: number }>(rows: T[], agentIds: number[], key: 'agentId' | 'id') =>
  agentIds.length ? rows.filter((r) => agentIds.includes(Number(r[key]))) : rows

export const listDashAgents = (): DashAgent[] => dashAgents
export const getAnnualRetention = () => annualRetention
export const getAttention = (agentIds: number[]) => {
  const names = dashAgents.filter((a) => !agentIds.length || agentIds.includes(a.id)).map((a) => a.name.split(' ')[0]!)
  return attentionItems.filter((i) => names.includes(i.agent))
}
export const getPeriodStats = (kind: PeriodKey): PeriodStats => periodStats[kind]
export const getChart = (kind: PeriodKey, tab: ChartTab): ChartData => chartFor(kind, tab)
export const getRanking = (agentIds: number[]): DashAgent[] => pick(dashAgents, agentIds, 'id').slice().sort((a, b) => b.retentionPct - a.retentionPct)
export const getUnvisited = (agentIds: number[]): UnvisitedSchool[] => pick(unvisitedSchools, agentIds, 'agentId')

export async function listPeriodVisits(range: PeriodRange, agentIds: number[]): Promise<VisitRow[]> {
  const rows = await listVisits({ from: null, to: null, agentId: null, schoolId: null, status: null })
  return rows.filter((r) => inRange(r.dateKey, range) && (!agentIds.length || agentIds.includes(r.agentId)))
}

import type { DashData } from './dashboard.types'
export async function loadDashboardMock(kind: PeriodKey): Promise<DashData> {
  return {
    agents: dashAgents, annual: annualRetention, attention: attentionItems, stats: periodStats[kind],
    charts: { renewal: chartFor(kind, 'renewal'), visits: chartFor(kind, 'visits'), duration: chartFor(kind, 'duration') }, unvisited: unvisitedSchools,
  }
}

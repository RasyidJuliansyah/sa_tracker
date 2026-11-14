import type { AttentionItem, ChartData, ChartTab, DashAgent, PeriodStats, UnvisitedSchool, annualRetention } from '@/mocks/dashboard'

/** Seluruh data satu tampilan Dashboard manager (satu periode). Filter agent diterapkan di layar. */
export interface DashData {
  agents: DashAgent[]
  annual: typeof annualRetention
  attention: AttentionItem[]
  stats: PeriodStats
  charts: Record<ChartTab, ChartData>
  unvisited: UnvisitedSchool[]
}

// Pintu masuk Dashboard manager: data tiruan di mode dev:mock, selain itu API sungguhan.
import { MOCK_TODAY, type PeriodKey } from '@/components/dashboard/period'
import { pinia } from '@/plugins/pinia'
import { MOCK_AUTH, useSessionStore } from '@/stores/session'
import { wibDateKey } from '@/utils/timezone'
import { loadDashboard as loadApi } from './dashboard.api'
import { listPeriodVisits as listMockVisits, loadDashboardMock } from './dashboard.mock'
import type { DashData } from './dashboard.types'
import { listVisits } from './manager'
import { inRange, type PeriodRange } from '@/components/dashboard/period'

export type { DashData } from './dashboard.types'

/** "Hari ini" untuk periode: tanggal tiruan di mode dev:mock, selain itu tanggal WIB sekarang. */
export const dashboardToday = (): string => (MOCK_AUTH ? MOCK_TODAY : wibDateKey(new Date()))

export const loadDashboard = (kind: PeriodKey, offset: number): Promise<DashData> => (MOCK_AUTH ? loadDashboardMock(kind) : loadApi(kind, offset))

/** Tabel kunjungan periode (semua atau agent terpilih). */
export async function listPeriodVisits(range: PeriodRange, agentIds: number[]) {
  if (MOCK_AUTH) return listMockVisits(range, agentIds)
  if (useSessionStore(pinia).user?.role === 'ADMIN') return [] // admin tidak melihat data kunjungan
  const rows = await listVisits({ from: range.start, to: range.end, agentId: null, schoolId: null, status: null })
  return rows.filter((r) => inRange(r.dateKey, range) && (!agentIds.length || agentIds.includes(r.agentId)))
}

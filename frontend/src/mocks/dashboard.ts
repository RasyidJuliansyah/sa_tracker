// Data tiruan Dashboard manager. Disamakan dengan Figma "03 Manager – Dashboard" (hari ini = Sabtu 14 Nov 2026).
// Rumus retention asli ada di backend; angka di sini tetap, bukan hasil hitung.
import type { IndoTimezone } from '@/utils/timezone'
import type { PeriodKey } from '@/components/dashboard/period'

export interface DashAgent {
  id: number // sama dengan id di mocks/manager.ts
  name: string
  timezone: IndoTimezone
  schools: number
  retentionPct: number
  /** Status dari kontrak yang sudah diputuskan (PLAN.md), bukan dari persentase yang tampil. */
  met: boolean
  retainedJt: number
  cohortJt: number
  contributionPct: number // porsi dari total retained
  visits: number
  unvisited: number
  seriesColor: 'chart-1' | 'chart-2' | 'chart-3'
}

// Sengaja kosong: diisi dari agregat backend begitu ada sekolah/kontrak/kunjungan asli.
export const dashAgents: DashAgent[] = []

export const TARGET_PERCENT = 65

/** Retention tahunan (tidak ikut pilihan periode) */
export const annualRetention = {
  year: 2026,
  percent: 0,
  status: 'BELOW' as 'MET' | 'BELOW',
  retainedJt: 0,
  targetJt: 0,
  cohortLabel: 'Rp 0',
  breakdown: [] as { key: string; label: string; contracts: number; amountLabel: string; dot: string }[],
  decisionNote: 'Belum ada data kontrak.',
}

export interface AttentionItem {
  school: string
  agent: string
  endLabel: string
  valueLabel: string
  badge: string
  kind: 'lapsed' | 'soon'
}

export const attentionItems: AttentionItem[] = []

export interface PeriodStats {
  renewal: { value: string; change: string; direction: 'up' | 'down'; comparison: string }
  visits: { value: string; change: string; direction: 'up' | 'down'; comparison: string }
  schools: { value: string; change: string; direction: 'up' | 'down'; comparison: string }
  duration: { value: string; change: string; direction: 'up' | 'down'; comparison: string }
  ratio: { value: string; note: string }
}

const emptyStat = { value: '0', change: '0%', direction: 'up' as const, comparison: '–' }
export const periodStats: Record<PeriodKey, PeriodStats> = {
  week: { renewal: emptyStat, visits: emptyStat, schools: emptyStat, duration: { ...emptyStat, value: '0 j 0 m' }, ratio: { value: '0 : 0', note: '0% ditugaskan' } },
  day: { renewal: emptyStat, visits: emptyStat, schools: emptyStat, duration: { ...emptyStat, value: '0 j 0 m' }, ratio: { value: '0 : 0', note: '0% ditugaskan' } },
  month: { renewal: emptyStat, visits: emptyStat, schools: emptyStat, duration: { ...emptyStat, value: '0 j 0 m' }, ratio: { value: '0 : 0', note: '0% ditugaskan' } },
}

export type ChartTab = 'renewal' | 'visits' | 'duration'

export interface ChartData {
  title: string
  subtitle: string
  unit: string
  labels: string[]
  now: number[]
  before: number[]
  nowLegend: string
  beforeLegend: string
  todayIndex: number | null
  max: number
}

// Seri Minggu persis seperti Figma (Kunjungan: 42 vs 37; Perpanjangan: Rp 120 jt vs Rp 80 jt; Durasi: 58 j 20 m vs 60 j 48 m).
const weekLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const zero7 = [0, 0, 0, 0, 0, 0, 0]
const weekSeries: Record<ChartTab, { now: number[]; before: number[]; unit: string; title: string; nowLegend: string; beforeLegend: string; max: number }> = {
  visits: { now: zero7, before: zero7, unit: 'kunjungan', title: 'Kunjungan per hari', nowLegend: 'Minggu ini: 0', beforeLegend: 'Minggu lalu: 0', max: 4 },
  renewal: { now: zero7, before: zero7, unit: 'jt', title: 'Perpanjangan per hari', nowLegend: 'Minggu ini: Rp 0 jt', beforeLegend: 'Minggu lalu: Rp 0 jt', max: 4 },
  duration: { now: zero7, before: zero7, unit: 'jam', title: 'Durasi per hari', nowLegend: 'Minggu ini: 0 j 0 m', beforeLegend: 'Minggu lalu: 0 j 0 m', max: 4 },
}

// Deret deterministik untuk Hari (per jam) dan Bulan (per hari) agar tab dan periode bisa dicoba.
function spread(n: number, total: number, seed: number): number[] {
  const raw = Array.from({ length: n }, (_, i) => 1 + ((i * 7 + seed * 5) % 5))
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => Math.round(((v / sum) * total) * 10) / 10)
}

export function chartFor(kind: PeriodKey, tab: ChartTab): ChartData {
  const nounWas = { day: 'Kemarin', week: 'Minggu lalu', month: 'Bulan lalu' }[kind]
  const nounNow = { day: 'Hari ini', week: 'Minggu ini', month: 'Bulan ini' }[kind]
  const ws = weekSeries[tab]
  if (kind === 'week') {
    return { title: ws.title, subtitle: 'Minggu ini dibanding minggu lalu', unit: ws.unit, labels: weekLabels, now: ws.now, before: ws.before, nowLegend: ws.nowLegend, beforeLegend: ws.beforeLegend, todayIndex: 5, max: ws.max }
  }
  const hours = kind === 'day'
  const n = hours ? 10 : 30
  const labels = hours ? Array.from({ length: n }, (_, i) => String(8 + i).padStart(2, '0')) : Array.from({ length: n }, (_, i) => String(i + 1))
  const scale = hours ? 1 : 4
  const nowTotal = Math.round(ws.now.reduce((a, b) => a + b, 0) * scale)
  const beforeTotal = Math.round(ws.before.reduce((a, b) => a + b, 0) * scale)
  const now = spread(n, nowTotal, 1)
  const before = spread(n, beforeTotal, 3)
  const fmt = (v: number) => (tab === 'renewal' ? `Rp ${v} jt` : tab === 'duration' ? `${Math.floor(v)} j ${Math.round((v % 1) * 60)} m` : String(v))
  return {
    title: `${ws.title.replace('per hari', hours ? 'per jam' : 'per hari')}`,
    subtitle: `${nounNow} dibanding ${nounWas.toLowerCase()}`,
    unit: ws.unit, labels, now, before,
    nowLegend: `${nounNow}: ${fmt(nowTotal)}`, beforeLegend: `${nounWas}: ${fmt(beforeTotal)}`,
    todayIndex: hours ? 2 : 13, max: Math.ceil(Math.max(...now, ...before) / 4) * 4 || 4,
  }
}

export interface UnvisitedSchool { name: string; agentId: number; agent: string; lastLabel: string }

export const unvisitedSchools: UnvisitedSchool[] = []

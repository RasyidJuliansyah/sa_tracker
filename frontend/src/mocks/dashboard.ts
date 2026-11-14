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

export const dashAgents: DashAgent[] = [
  { id: 4, name: 'Dimas Saputra', timezone: 'WIB', schools: 4, retentionPct: 80.0, met: true, retainedJt: 248, cohortJt: 310, contributionPct: 33.4, visits: 14, unvisited: 1, seriesColor: 'chart-1' },
  { id: 5, name: 'Ayu Lestari', timezone: 'WITA', schools: 6, retentionPct: 62.7, met: true, retainedJt: 296, cohortJt: 472, contributionPct: 39.9, visits: 16, unvisited: 2, seriesColor: 'chart-2' },
  { id: 6, name: 'Yohanes Wenda', timezone: 'WIT', schools: 5, retentionPct: 43.2, met: false, retainedJt: 198, cohortJt: 458, contributionPct: 26.7, visits: 12, unvisited: 3, seriesColor: 'chart-3' },
]

export const TARGET_PERCENT = 65

/** Retention tahunan (tidak ikut pilihan periode) */
export const annualRetention = {
  year: 2026,
  percent: 59.8,
  status: 'MET' as 'MET' | 'BELOW',
  retainedJt: 742,
  targetJt: 806,
  cohortLabel: 'Rp 1,24 M',
  breakdown: [
    { key: 'renewed', label: 'Sudah diperpanjang', contracts: 18, amountLabel: 'Rp 742 jt', dot: 'success-solid' },
    { key: 'lapsed', label: 'Berakhir, belum diperpanjang', contracts: 3, amountLabel: 'Rp 238 jt', dot: 'error-solid' },
    { key: 'pending', label: 'Belum jatuh tempo', contracts: 5, amountLabel: 'Rp 260 jt', dot: 'warning-solid' },
  ],
  decisionNote: 'Status dari kontrak yang sudah diputuskan: 75,7% (Rp 742 jt dari Rp 980 jt) ≥ target 65%.',
}

export interface AttentionItem {
  school: string
  agent: string
  endLabel: string
  valueLabel: string
  badge: string
  kind: 'lapsed' | 'soon'
}

export const attentionItems: AttentionItem[] = [
  { school: 'SMP Gemilang Bogor', agent: 'Dimas', endLabel: '30 Sep 2026', valueLabel: 'Rp 45 jt', badge: 'Lewat 45 hari', kind: 'lapsed' },
  { school: 'SMA Mutiara Makassar', agent: 'Ayu', endLabel: '31 Okt 2026', valueLabel: 'Rp 96 jt', badge: 'Lewat 14 hari', kind: 'lapsed' },
  { school: 'SMA Lentera Jayapura', agent: 'Yohanes', endLabel: '31 Agu 2026', valueLabel: 'Rp 74 jt', badge: 'Lewat 75 hari', kind: 'lapsed' },
  { school: 'SD Cahaya Ilmu Depok', agent: 'Dimas', endLabel: '31 Des 2026', valueLabel: 'Rp 60 jt', badge: '47 hari lagi', kind: 'soon' },
  { school: 'SMK Taruna Jaya Balikpapan', agent: 'Ayu', endLabel: '31 Des 2026', valueLabel: 'Rp 88 jt', badge: '47 hari lagi', kind: 'soon' },
]

export interface PeriodStats {
  renewal: { value: string; change: string; direction: 'up' | 'down'; comparison: string }
  visits: { value: string; change: string; direction: 'up' | 'down'; comparison: string }
  schools: { value: string; change: string; direction: 'up' | 'down'; comparison: string }
  duration: { value: string; change: string; direction: 'up' | 'down'; comparison: string }
  ratio: { value: string; note: string }
}

export const periodStats: Record<PeriodKey, PeriodStats> = {
  week: {
    renewal: { value: 'Rp 120 jt', change: '+50,0%', direction: 'up', comparison: 'vs Rp 80 jt' },
    visits: { value: '42', change: '+12,5%', direction: 'up', comparison: '2 berlangsung' },
    schools: { value: '31', change: '+3', direction: 'up', comparison: 'vs 28' },
    duration: { value: '58 j 20 m', change: '−4,1%', direction: 'down', comparison: 'rata-rata 1 j 23 m' },
    ratio: { value: '36 : 6', note: '86% ditugaskan' },
  },
  day: {
    renewal: { value: 'Rp 40 jt', change: '+33,3%', direction: 'up', comparison: 'vs Rp 30 jt' },
    visits: { value: '8', change: '+14,3%', direction: 'up', comparison: '2 berlangsung' },
    schools: { value: '8', change: '+1', direction: 'up', comparison: 'vs 7' },
    duration: { value: '9 j 55 m', change: '−6,0%', direction: 'down', comparison: 'rata-rata 1 j 14 m' },
    ratio: { value: '7 : 1', note: '88% ditugaskan' },
  },
  month: {
    renewal: { value: 'Rp 306 jt', change: '+14,2%', direction: 'up', comparison: 'vs Rp 268 jt' },
    visits: { value: '164', change: '+8,6%', direction: 'up', comparison: '2 berlangsung' },
    schools: { value: '52', change: '+4', direction: 'up', comparison: 'vs 48' },
    duration: { value: '231 j 10 m', change: '+3,2%', direction: 'up', comparison: 'rata-rata 1 j 25 m' },
    ratio: { value: '140 : 24', note: '85% ditugaskan' },
  },
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
const weekSeries: Record<ChartTab, { now: number[]; before: number[]; unit: string; title: string; nowLegend: string; beforeLegend: string; max: number }> = {
  visits: { now: [8, 7, 9, 6, 10, 2, 0], before: [7, 6, 8, 7, 8, 1, 0], unit: 'kunjungan', title: 'Kunjungan per hari', nowLegend: 'Minggu ini: 42', beforeLegend: 'Minggu lalu: 37', max: 12 },
  renewal: { now: [0, 30, 0, 40, 50, 0, 0], before: [0, 0, 50, 0, 30, 0, 0], unit: 'jt', title: 'Perpanjangan per hari', nowLegend: 'Minggu ini: Rp 120 jt', beforeLegend: 'Minggu lalu: Rp 80 jt', max: 60 },
  duration: { now: [10.5, 9.3, 12.0, 8.2, 13.1, 5.2, 0], before: [11, 8.8, 12.5, 9.6, 13.5, 5.4, 0], unit: 'jam', title: 'Durasi per hari', nowLegend: 'Minggu ini: 58 j 20 m', beforeLegend: 'Minggu lalu: 60 j 48 m', max: 16 },
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

export const unvisitedSchools: UnvisitedSchool[] = [
  { name: 'SMK Taruna Jaya Karawang', agentId: 4, agent: 'Dimas', lastLabel: 'terakhir 28 Okt 2026' },
  { name: 'SMA Mutiara Makassar', agentId: 5, agent: 'Ayu', lastLabel: 'terakhir 2 Nov 2026' },
  { name: 'SD Kasih Bunda Samarinda', agentId: 5, agent: 'Ayu', lastLabel: 'belum pernah dikunjungi' },
  { name: 'SMA Lentera Jayapura', agentId: 6, agent: 'Yohanes', lastLabel: 'terakhir 20 Okt 2026' },
  { name: 'SMP Bintang Timur Merauke', agentId: 6, agent: 'Yohanes', lastLabel: 'terakhir 27 Okt 2026' },
  { name: 'SD Pelangi Sorong', agentId: 6, agent: 'Yohanes', lastLabel: 'terakhir 5 Nov 2026' },
]

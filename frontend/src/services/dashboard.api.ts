// Dashboard manager dari API: bentuk keluaran sama dengan data tiruan (angka mentah diformat di sini).
import type { PeriodKey } from '@/components/dashboard/period'
import type { AttentionItem, ChartData, ChartTab, DashAgent, PeriodStats, UnvisitedSchool } from '@/mocks/dashboard'
import { formatDateShort, formatDuration, formatPercent, formatRupiahCompact, formatSignedPercent } from '@/utils/format'
import { api } from './http'
import type { DashData } from './dashboard.types'

interface Totals { visits: number; ongoing: number; schools: number; completed: number; durationMinutes: number; renewalValue: number; assignedVisits: number; otherVisits: number }
interface Series { labels: string[]; visits: number[]; renewal: number[]; durationHours: number[] }
interface ApiDash {
  today: string
  annual: { year: number; targetPercent: number; cohortValue: number; retainedValue: number; percent: number | null; targetValue: number; decidedValue: number; decidedRetained: number; status: 'MET' | 'BELOW' | 'NO_DATA'; breakdown: Record<'renewed' | 'lapsed' | 'pending', { count: number; amount: number }> }
  agents: { id: number; name: string; timezone: DashAgent['timezone']; schools: number; retentionPct: number; status: 'MET' | 'BELOW' | 'NO_DATA'; retainedValue: number; cohortValue: number; contributionPct: number; visits: number; unvisited: number }[]
  stats: { current: Totals; previous: Totals }
  chart: { labels: string[]; now: Series; before: Series }
  attention: { school: string; agent: string | null; endDate: string; value: number; kind: 'lapsed' | 'soon'; days: number }[]
  unvisited: { name: string; agentId: number; agent: string; lastVisitAt: string | null }[]
}

const first = (n: string | null) => (n ? n.split(' ')[0]! : 'Tanpa agent')
const pctChange = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? '0,0%' : '+100,0%') : formatSignedPercent(((cur - prev) / prev) * 100))
const dir = (cur: number, prev: number): 'up' | 'down' => (cur >= prev ? 'up' : 'down')
const NOUN = { day: ['Hari ini', 'Kemarin'], week: ['Minggu ini', 'Minggu lalu'], month: ['Bulan ini', 'Bulan lalu'] } as const

function statsFrom(c: Totals, p: Totals): PeriodStats {
  const avg = c.completed ? Math.round(c.durationMinutes / c.completed) : 0
  const total = c.assignedVisits + c.otherVisits
  return {
    renewal: { value: formatRupiahCompact(c.renewalValue), change: pctChange(c.renewalValue, p.renewalValue), direction: dir(c.renewalValue, p.renewalValue), comparison: p.renewalValue ? `vs ${formatRupiahCompact(p.renewalValue)}` : 'vs –' },
    visits: { value: String(c.completed), change: pctChange(c.completed, p.completed), direction: dir(c.completed, p.completed), comparison: `${c.ongoing} berlangsung` },
    schools: { value: String(c.schools), change: `${c.schools >= p.schools ? '+' : '−'}${Math.abs(c.schools - p.schools)}`, direction: dir(c.schools, p.schools), comparison: `vs ${p.schools}` },
    duration: { value: formatDuration(c.durationMinutes), change: pctChange(c.durationMinutes, p.durationMinutes), direction: dir(c.durationMinutes, p.durationMinutes), comparison: `rata-rata ${formatDuration(avg)}` },
    ratio: { value: `${c.assignedVisits} : ${c.otherVisits}`, note: `${total ? Math.round((c.assignedVisits / total) * 100) : 0}% ditugaskan` },
  }
}

function chartFrom(kind: PeriodKey, tab: ChartTab, d: ApiDash, todayIndex: number | null): ChartData {
  const pick = (s: Series) => (tab === 'visits' ? s.visits : tab === 'renewal' ? s.renewal.map((v) => v / 1_000_000) : s.durationHours)
  let labels = d.chart.labels, now = pick(d.chart.now), before = pick(d.chart.before)
  let idx = todayIndex
  if (kind === 'day') {
    // Tampilkan 08–17 atau lebih lebar bila ada aktivitas di luar jam itu.
    const active = now.map((v, i) => (v || before[i] ? i : -1)).filter((i) => i >= 0)
    const from = Math.min(8, ...active), to = Math.max(17, ...active)
    labels = labels.slice(from, to + 1); now = now.slice(from, to + 1); before = before.slice(from, to + 1)
    idx = todayIndex === null ? null : todayIndex - from
  }
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
  const fmt = (v: number) => (tab === 'renewal' ? formatRupiahCompact(v * 1_000_000) : tab === 'duration' ? formatDuration(Math.round(v * 60)) : String(Math.round(v)))
  const [nowNoun, beforeNoun] = NOUN[kind]
  const title = { visits: 'Kunjungan', renewal: 'Perpanjangan', duration: 'Durasi' }[tab] + (kind === 'day' ? ' per jam' : ' per hari')
  const max = Math.max(...now, ...before, 1)
  return {
    title, subtitle: `${nowNoun} dibanding ${beforeNoun.toLowerCase()}`, unit: { visits: 'kunjungan', renewal: 'jt', duration: 'jam' }[tab],
    labels, now, before, nowLegend: `${nowNoun}: ${fmt(sum(now))}`, beforeLegend: `${beforeNoun}: ${fmt(sum(before))}`, todayIndex: idx, max: Math.ceil(max * 1.2),
  }
}

export async function loadDashboard(kind: PeriodKey, offset: number): Promise<DashData> {
  const d = await api<ApiDash>(`/dashboard/manager?period=${kind}&offset=${offset}`)
  const nowWib = new Date(Date.now() + 7 * 3_600_000)
  const todayIndex = offset !== 0 ? null : kind === 'day' ? nowWib.getUTCHours() : kind === 'week' ? (nowWib.getUTCDay() + 6) % 7 : nowWib.getUTCDate() - 1
  const a = d.annual
  const decided = a.decidedValue > 0
    ? `Status dari kontrak yang sudah diputuskan: ${formatPercent((a.decidedRetained / a.decidedValue) * 100)} (${formatRupiahCompact(a.decidedRetained)} dari ${formatRupiahCompact(a.decidedValue)}) ${a.status === 'MET' ? '≥' : '<'} target ${a.targetPercent}%.`
    : 'Belum ada kontrak yang diputuskan pada kohort tahun ini.'
  return {
    agents: d.agents.map((x, i) => ({
      id: x.id, name: x.name, timezone: x.timezone, schools: x.schools, retentionPct: x.retentionPct, met: x.status === 'MET',
      retainedJt: Math.round(x.retainedValue / 1_000_000), cohortJt: Math.round(x.cohortValue / 1_000_000), contributionPct: x.contributionPct,
      visits: x.visits, unvisited: x.unvisited, seriesColor: (['chart-1', 'chart-2', 'chart-3'] as const)[i % 3]!,
    })),
    annual: {
      year: a.year, percent: a.percent ?? 0, status: a.status === 'MET' ? 'MET' : 'BELOW',
      retainedJt: a.retainedValue / 1_000_000, targetJt: a.targetValue / 1_000_000, cohortLabel: formatRupiahCompact(a.cohortValue),
      breakdown: [
        { key: 'renewed', label: 'Sudah diperpanjang', contracts: a.breakdown.renewed.count, amountLabel: formatRupiahCompact(a.breakdown.renewed.amount), dot: 'success-solid' },
        { key: 'lapsed', label: 'Berakhir, belum diperpanjang', contracts: a.breakdown.lapsed.count, amountLabel: formatRupiahCompact(a.breakdown.lapsed.amount), dot: 'error-solid' },
        { key: 'pending', label: 'Belum jatuh tempo', contracts: a.breakdown.pending.count, amountLabel: formatRupiahCompact(a.breakdown.pending.amount), dot: 'warning-solid' },
      ],
      decisionNote: decided,
    },
    attention: d.attention.map((i): AttentionItem => ({
      school: i.school, agent: first(i.agent), endLabel: formatDateShort(`${i.endDate}T00:00:00+07:00`), valueLabel: formatRupiahCompact(i.value),
      badge: i.kind === 'lapsed' ? `Lewat ${i.days} hari` : `${i.days} hari lagi`, kind: i.kind,
    })),
    stats: statsFrom(d.stats.current, d.stats.previous),
    charts: { visits: chartFrom(kind, 'visits', d, todayIndex), renewal: chartFrom(kind, 'renewal', d, todayIndex), duration: chartFrom(kind, 'duration', d, todayIndex) },
    unvisited: d.unvisited.map((u): UnvisitedSchool => ({
      name: u.name, agentId: u.agentId, agent: first(u.agent), lastLabel: u.lastVisitAt ? `terakhir ${formatDateShort(u.lastVisitAt)}` : 'belum pernah dikunjungi',
    })),
  }
}

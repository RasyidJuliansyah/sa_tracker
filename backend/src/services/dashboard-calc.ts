// Hitungan agregat dashboard yang murni (tanpa database). Semua batas hari memakai WIB.
import type { Period } from '../utils/period.js'
import { dateKeyIn } from '../utils/timezone.js'
import type { PeriodKind } from '../utils/period.js'

export interface VisitLite { agentId: number; schoolId: number; checkInAt: Date; checkOutAt: Date | null; assigned: boolean }
export interface RenewalLite { value: number; signedDate: string } // yyyy-mm-dd

export interface PeriodTotals {
  visits: number; ongoing: number; schools: number; durationMinutes: number; completed: number
  renewalValue: number; assignedVisits: number; otherVisits: number
}

const inVisitPeriod = (v: VisitLite, p: Period) => v.checkInAt >= p.fromUtc && v.checkInAt < p.toUtc
const inDatePeriod = (d: string, p: Period) => d >= p.start && d <= p.end

export function totalsFor(visits: VisitLite[], renewals: RenewalLite[], p: Period): PeriodTotals {
  const vs = visits.filter((v) => inVisitPeriod(v, p))
  const done = vs.filter((v) => v.checkOutAt)
  return {
    visits: vs.length, ongoing: vs.length - done.length, schools: new Set(vs.map((v) => v.schoolId)).size, completed: done.length,
    durationMinutes: done.reduce((a, v) => a + Math.round((v.checkOutAt!.getTime() - v.checkInAt.getTime()) / 60000), 0),
    renewalValue: renewals.filter((r) => inDatePeriod(r.signedDate, p)).reduce((a, r) => a + r.value, 0),
    assignedVisits: vs.filter((v) => v.assigned).length, otherVisits: vs.filter((v) => !v.assigned).length,
  }
}

export interface Series { labels: string[]; visits: number[]; renewal: number[]; durationHours: number[] }

/** Deret per bucket: Hari = per jam (0–23), Minggu = Sen–Min, Bulan = per tanggal. Bulan pembanding dipad/dipotong sepanjang periode ini. */
export function seriesFor(kind: PeriodKind, visits: VisitLite[], renewals: RenewalLite[], p: Period, length?: number): Series {
  const n = length ?? (kind === 'day' ? 24 : Math.round((Date.parse(`${p.end}T00:00:00Z`) - Date.parse(`${p.start}T00:00:00Z`)) / 86_400_000) + 1)
  const s: Series = { labels: [], visits: Array(n).fill(0), renewal: Array(n).fill(0), durationHours: Array(n).fill(0) }
  const dayIndex = (key: string) => Math.round((Date.parse(`${key}T00:00:00Z`) - Date.parse(`${p.start}T00:00:00Z`)) / 86_400_000)
  for (const v of visits.filter((x) => inVisitPeriod(x, p))) {
    const wib = new Date(v.checkInAt.getTime() + 7 * 3_600_000)
    const i = kind === 'day' ? wib.getUTCHours() : dayIndex(dateKeyIn(v.checkInAt))
    if (i < 0 || i >= n) continue
    s.visits[i]! += 1
    if (v.checkOutAt) s.durationHours[i]! += (v.checkOutAt.getTime() - v.checkInAt.getTime()) / 3_600_000
  }
  if (kind !== 'day') {
    for (const r of renewals.filter((x) => inDatePeriod(x.signedDate, p))) {
      const i = dayIndex(r.signedDate)
      if (i >= 0 && i < n) s.renewal[i]! += r.value
    }
  }
  s.durationHours = s.durationHours.map((h) => Math.round(h * 10) / 10)
  s.labels = kind === 'day' ? Array.from({ length: n }, (_, i) => String(i).padStart(2, '0')) : kind === 'week' ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] : Array.from({ length: n }, (_, i) => String(i + 1))
  return s
}

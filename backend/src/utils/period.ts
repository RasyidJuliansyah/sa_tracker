import { addDays, endOfDayExclusiveUtc, startOfDayUtc } from './timezone.js'

export type PeriodKind = 'day' | 'week' | 'month'
export interface Period {
  start: string // yyyy-mm-dd WIB, inklusif
  end: string // inklusif
  fromUtc: Date // inklusif
  toUtc: Date // eksklusif
}

const toUtcDate = (k: string) => new Date(`${k}T00:00:00Z`)
const key = (d: Date) => d.toISOString().slice(0, 10)

/** Periode WIB yang memuat `anchor` (yyyy-mm-dd), digeser `offset` periode. Minggu = Senin–Minggu. */
export function periodFor(kind: PeriodKind, anchor: string, offset = 0): Period {
  let start: string
  let end: string
  if (kind === 'day') {
    start = end = addDays(anchor, offset)
  } else if (kind === 'week') {
    const dow = (toUtcDate(anchor).getUTCDay() + 6) % 7
    start = addDays(anchor, -dow + offset * 7)
    end = addDays(start, 6)
  } else {
    const a = toUtcDate(anchor)
    const first = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + offset, 1))
    start = key(first)
    end = key(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)))
  }
  return { start, end, fromUtc: startOfDayUtc(start, 'WIB'), toUtc: endOfDayExclusiveUtc(end, 'WIB') }
}

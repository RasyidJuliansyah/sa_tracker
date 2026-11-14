// Periode dashboard menurut WIB: Hari, Minggu (Senin–Minggu), Bulan kalender (docs/PLAN.md, bagian Dashboard).
// Tanggal diperlakukan sebagai tanggal kalender WIB (yyyy-mm-dd), jadi aritmetika memakai UTC murni tanpa pergeseran zona.
export type PeriodKey = 'day' | 'week' | 'month'

/** "Hari ini" tiruan, sama dengan data Figma (Sabtu, 14 November 2026). */
export const MOCK_TODAY = '2026-11-14'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const toUtc = (key: string) => {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d))
}
const toKey = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (key: string, n: number) => toKey(new Date(toUtc(key).getTime() + n * 86_400_000))

export interface PeriodRange {
  start: string
  end: string
  /** Label panjang, mis. "9–15 November 2026" */
  label: string
}

function describe(start: string, end: string, kind: PeriodKey): string {
  const s = toUtc(start)
  const e = toUtc(end)
  const endText = `${e.getUTCDate()} ${MONTHS[e.getUTCMonth()]} ${e.getUTCFullYear()}`
  if (kind === 'day') return `${DAYS[s.getUTCDay()]}, ${endText}`
  if (kind === 'month') return `${MONTHS[s.getUTCMonth()]} ${s.getUTCFullYear()}`
  if (s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear()) return `${s.getUTCDate()}–${endText}`
  if (s.getUTCFullYear() === e.getUTCFullYear()) return `${s.getUTCDate()} ${MONTHS[s.getUTCMonth()]}–${endText}`
  return `${s.getUTCDate()} ${MONTHS[s.getUTCMonth()]} ${s.getUTCFullYear()}–${endText}`
}

/** Rentang periode yang memuat `anchor`, digeser `offset` periode (−1 = sebelumnya). */
export function periodRange(kind: PeriodKey, anchor: string, offset = 0): PeriodRange {
  let start: string
  let end: string
  if (kind === 'day') {
    start = end = addDays(anchor, offset)
  } else if (kind === 'week') {
    const dow = (toUtc(anchor).getUTCDay() + 6) % 7 // Senin = 0
    start = addDays(anchor, -dow + offset * 7)
    end = addDays(start, 6)
  } else {
    const a = toUtc(anchor)
    const first = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + offset, 1))
    start = toKey(first)
    end = toKey(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)))
  }
  return { start, end, label: describe(start, end, kind) }
}

export const PERIOD_NOUN: Record<PeriodKey, string> = { day: 'hari', week: 'minggu', month: 'bulan' }

/** Kalimat penjelasan di bawah pemilih periode. */
export function comparisonSentence(kind: PeriodKey, anchor: string, offset = 0): string {
  const prev = periodRange(kind, anchor, offset - 1)
  return `Periode dihitung dalam WIB. Setiap angka dibandingkan dengan ${PERIOD_NOUN[kind]} sebelumnya (${prev.label}).`
}

/** Apakah tanggal (yyyy-mm-dd, WIB) jatuh di dalam rentang. */
export function inRange(dateKey: string, range: PeriodRange): boolean {
  return dateKey >= range.start && dateKey <= range.end
}

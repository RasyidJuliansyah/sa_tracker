// Satu-satunya tempat konversi zona waktu. Waktu disimpan UTC; hari/periode dihitung dalam WIB.
export type Tz = 'WIB' | 'WITA' | 'WIT'

export const TZ_IANA: Record<Tz, string> = { WIB: 'Asia/Jakarta', WITA: 'Asia/Makassar', WIT: 'Asia/Jayapura' }
const OFFSET_HOURS: Record<Tz, number> = { WIB: 7, WITA: 8, WIT: 9 }
const HOUR = 3_600_000
const DAY = 86_400_000

/** Tanggal kalender (yyyy-mm-dd) dari instan UTC di zona tertentu. */
export function dateKeyIn(instant: Date, tz: Tz = 'WIB'): string {
  return new Date(instant.getTime() + OFFSET_HOURS[tz] * HOUR).toISOString().slice(0, 10)
}

/** Instan UTC awal hari (00:00) untuk tanggal kalender di zona tertentu. */
export function startOfDayUtc(dateKey: string, tz: Tz = 'WIB'): Date {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) - OFFSET_HOURS[tz] * HOUR)
}

/** Batas atas eksklusif hari itu (awal hari berikutnya) sebagai UTC. */
export function endOfDayExclusiveUtc(dateKey: string, tz: Tz = 'WIB'): Date {
  return new Date(startOfDayUtc(dateKey, tz).getTime() + DAY)
}

export function isDateKey(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  return new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v
}

export function addDays(dateKey: string, n: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10)
}

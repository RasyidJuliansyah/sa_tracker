// Satu-satunya tempat konversi zona waktu. Hanya WIB, WITA, WIT (docs/PLAN.md, Aturan zona waktu).
export type IndoTimezone = 'WIB' | 'WITA' | 'WIT'

export const IANA_ZONE: Record<IndoTimezone, string> = {
  WIB: 'Asia/Jakarta',
  WITA: 'Asia/Makassar',
  WIT: 'Asia/Jayapura',
}

/** Jam di zona tertentu, mis. "09.15 WIB". Waktu disimpan UTC, ditampilkan di zona agent. */
export function formatClock(date: Date | string, tz: IndoTimezone): string {
  const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: IANA_ZONE[tz] }).format(new Date(date))
  return `${time} ${tz}`
}

/** Tanggal kalender (yyyy-mm-dd) menurut WIB. Dipakai untuk rekap dan periode dashboard. */
export function wibDateKey(date: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: IANA_ZONE.WIB }).format(new Date(date))
}

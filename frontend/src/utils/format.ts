import { IANA_ZONE } from './timezone'

// Format angka dan tanggal id-ID. Semua layar memakai helper ini, bukan format manual (docs/design-system.md).
const id = 'id-ID'

/** Rp 156.841.000 */
export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString(id)}`
}

/** Rp 156,8 jt atau Rp 1,2 M. Nilai penuh tetap ditaruh di tooltip. */
export function formatRupiahCompact(value: number): string {
  const abs = Math.abs(value)
  const one = { maximumFractionDigits: 1 }
  if (abs >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toLocaleString(id, one)} M`
  if (abs >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString(id, one)} jt`
  return formatRupiah(value)
}

/** 39,6% (satu desimal, koma) */
export function formatPercent(value: number): string {
  return `${value.toLocaleString(id, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/** +12,5% atau −4,2%. Selalu bertanda, memakai tanda minus sebenarnya (−), bukan hubung. */
export function formatSignedPercent(value: number): string {
  const body = Math.abs(value).toLocaleString(id, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${value < 0 ? '−' : '+'}${body}%`
}

/** 14 November 2026, menurut WIB */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(id, { day: 'numeric', month: 'long', year: 'numeric', timeZone: IANA_ZONE.WIB }).format(new Date(date))
}

/** Sab, 14 Nov 2026 */
export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat(id, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: IANA_ZONE.WIB }).format(new Date(date))
}

/** Sabtu, 14 November 2026 */
export function formatDateLong(date: Date | string): string {
  return new Intl.DateTimeFormat(id, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: IANA_ZONE.WIB }).format(new Date(date))
}

/** 1 j 25 m. Menit di bawah satu jam ditulis "25 m". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} m`
  return `${h} j ${m} m`
}

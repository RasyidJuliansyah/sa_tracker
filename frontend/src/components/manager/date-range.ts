// Pembantu rentang tanggal untuk filter rekap. Tanggal dari date picker adalah tanggal kalender lokal;
// dibandingkan sebagai yyyy-mm-dd dengan tanggal kunjungan menurut WIB.
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmt = (opts: Intl.DateTimeFormatOptions, d: Date) => new Intl.DateTimeFormat('id-ID', opts).format(d)

export function dateRangeKeys(range: Date[]): { from: string | null; to: string | null } {
  if (!range.length) return { from: null, to: null }
  const times = range.map((d) => d.getTime())
  return { from: key(new Date(Math.min(...times))), to: key(new Date(Math.max(...times))) }
}

/** "1–14 Nov 2026", "28 Okt–3 Nov 2026", "14 Nov 2026", atau "Semua tanggal". */
export function dateRangeLabel(range: Date[]): string {
  if (!range.length) return 'Semua tanggal'
  const times = range.map((d) => d.getTime())
  const from = new Date(Math.min(...times))
  const to = new Date(Math.max(...times))
  const end = fmt({ day: 'numeric', month: 'short', year: 'numeric' }, to)
  if (key(from) === key(to)) return end
  return from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()
    ? `${fmt({ day: 'numeric' }, from)}–${end}`
    : `${fmt({ day: 'numeric', month: 'short' }, from)}–${end}`
}

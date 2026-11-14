// Netralisasi CSV injection: sel yang diawali = + - @ tab atau CR diberi awalan apostrof.
export function neutralizeCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

const quote = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

/** Susun CSV UTF-8 dengan BOM; setiap sel dinetralkan. */
export function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header, ...rows].map((r) => r.map((c) => quote(neutralizeCell(c))).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

/** Parser CSV sederhana (kutip ganda, koma di dalam kutip, baris baru). Mengembalikan baris berisi sel. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = [], cell = '', inQ = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!
    if (inQ) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i++ } else inQ = false } else cell += ch
    } else if (ch === '"') inQ = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((c) => c !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c !== '')) rows.push(row)
  return rows
}

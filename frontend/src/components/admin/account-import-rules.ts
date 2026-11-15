// Pratinjau impor CSV akun: validasi per baris sebelum disimpan. Cermin dari backend account-csv.service.ts.
import { parseCsv } from '@/components/school/csv'
import type { AccountRole } from '@/mocks/admin'
import type { IndoTimezone } from '@/utils/timezone'

export const IMPORT_COLUMNS = ['nama', 'email', 'peran', 'zona_waktu', 'password'] as const
const ROLES: AccountRole[] = ['ADMIN', 'MANAGER', 'AGENT']
const asRole = (v: string): AccountRole | null => ROLES.find((r) => r === v.toUpperCase()) ?? null
export const asZone = (v: string): IndoTimezone => (v.toUpperCase() === 'WITA' || v.toUpperCase() === 'WIT' ? (v.toUpperCase() as IndoTimezone) : 'WIB')

export interface AccountImportRow {
  line: number; name: string; email: string; role: string; timezone: string; password: string
  isNew: boolean; ok: boolean; message: string
}

/** header = baris pertama file; baris data bernomor menurut baris di file (header = 1). */
export function previewAccountImport(text: string, existingEmails: Set<string>): { rows: AccountImportRow[]; fileError: string } {
  const table = parseCsv(text)
  if (table.length < 2) return { rows: [], fileError: 'File kosong atau tidak berisi baris data.' }
  const header = table[0]!.map((h) => h.trim().toLowerCase())
  const missing = (['nama', 'email', 'peran'] as const).filter((h) => !header.includes(h))
  if (missing.length) return { rows: [], fileError: `Kolom wajib tidak ada: ${missing.join(', ')}. Unduh template untuk format yang benar.` }
  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? '').trim()

  const seen = new Set<string>()
  const rows = table.slice(1).map((r, i): AccountImportRow => {
    const row: AccountImportRow = {
      line: i + 2, name: col(r, 'nama'), email: col(r, 'email').toLowerCase(), role: col(r, 'peran'),
      timezone: col(r, 'zona_waktu') || 'WIB', password: col(r, 'password'), isNew: false, ok: false, message: '',
    }
    row.isNew = !!row.email && !existingEmails.has(row.email)
    const fail = (message: string) => { row.message = message; return row }

    if (!row.name) return fail('Nama wajib diisi')
    if (!row.email) return fail('Email wajib diisi')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return fail('Format email tidak valid')
    if (seen.has(row.email)) return fail(`Email ${row.email} ganda di file ini`)
    seen.add(row.email)
    if (!asRole(row.role)) return fail(`Peran "${row.role}" harus ADMIN, MANAGER, atau AGENT`)
    if (row.timezone && !['WIB', 'WITA', 'WIT'].includes(row.timezone.toUpperCase())) return fail(`Zona waktu "${row.timezone}" tidak dikenali`)
    if (row.password && row.password.length < 8) return fail('Password minimal 8 karakter, atau kosongkan untuk password sementara otomatis')
    row.ok = true
    row.message = row.isNew ? `Valid • akun baru, peran ${asRole(row.role)}` : 'Valid • data diperbarui (password dan email tidak berubah)'
    return row
  })
  return { rows, fileError: '' }
}

export interface AccountImportSummary { total: number; created: number; updated: number; failed: number }
export function summarizeAccountImport(rows: AccountImportRow[]): AccountImportSummary {
  return {
    total: rows.length,
    created: rows.filter((r) => r.ok && r.isNew).length,
    updated: rows.filter((r) => r.ok && !r.isNew).length,
    failed: rows.filter((r) => !r.ok).length,
  }
}

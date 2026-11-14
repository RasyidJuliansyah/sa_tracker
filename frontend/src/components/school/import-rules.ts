// Pratinjau impor CSV sekolah: validasi per baris sebelum disimpan. Jenjang dan paket dicocokkan dengan master.
import { LEVELS, PACKAGES, type Level, type Pkg } from '@/mocks/school'
import { formatRupiah } from '@/utils/format'
import { parseCsv } from './csv'
import { validatePeriod } from './contract-rules'
import type { IndoTimezone } from '@/utils/timezone'

export const IMPORT_COLUMNS = [
  'npsn', 'nama_sekolah', 'jenjang', 'paket', 'zona_waktu', 'kota', 'alamat', 'pic', 'kontak_pic', 'id_lms',
  'tanggal_ttd', 'tanggal_mulai', 'tanggal_berakhir', 'nilai_kontrak',
] as const

export interface ImportRow {
  line: number
  npsn: string
  name: string
  level: string
  pkg: string
  timezone: string
  city: string
  address: string
  pic: string
  picContact: string
  lmsId: string
  signed: string
  start: string
  end: string
  value: number
  isNew: boolean
  ok: boolean
  message: string
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** header = baris pertama file; baris data bernomor menurut baris di file (header = 1). */
export function previewImport(text: string, existingNpsn: Set<string>): { rows: ImportRow[]; fileError: string } {
  const table = parseCsv(text)
  if (table.length < 2) return { rows: [], fileError: 'File kosong atau tidak berisi baris data.' }
  const header = table[0]!.map((h) => h.trim().toLowerCase())
  const missing = (['npsn', 'nama_sekolah', 'jenjang', 'paket'] as const).filter((h) => !header.includes(h))
  if (missing.length) return { rows: [], fileError: `Kolom wajib tidak ada: ${missing.join(', ')}. Unduh template untuk format yang benar.` }
  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? '').trim()

  const seen = new Set<string>()
  const rows = table.slice(1).map((r, i): ImportRow => {
    const row: ImportRow = {
      line: i + 2, npsn: col(r, 'npsn'), name: col(r, 'nama_sekolah'), level: col(r, 'jenjang'), pkg: col(r, 'paket'),
      timezone: col(r, 'zona_waktu') || 'WIB', city: col(r, 'kota'), address: col(r, 'alamat'), pic: col(r, 'pic'),
      picContact: col(r, 'kontak_pic'), lmsId: col(r, 'id_lms'), signed: col(r, 'tanggal_ttd'), start: col(r, 'tanggal_mulai'),
      end: col(r, 'tanggal_berakhir'), value: Number(col(r, 'nilai_kontrak').replace(/\D/g, '')) || 0,
      isNew: false, ok: false, message: '',
    }
    row.isNew = !!row.npsn && !existingNpsn.has(row.npsn)
    const fail = (message: string) => { row.message = message; return row }

    if (!row.npsn) return fail('NPSN wajib diisi')
    if (seen.has(row.npsn)) return fail(`NPSN ${row.npsn} ganda di file ini`)
    seen.add(row.npsn)
    if (!row.name) return fail('Nama sekolah wajib diisi')
    if (!LEVELS.includes(row.level as Level)) return fail(`Jenjang "${row.level}" tidak ada di master jenjang`)
    if (!PACKAGES.includes(row.pkg as Pkg)) return fail(`Paket "${row.pkg}" tidak ada di master paket`)
    if (row.lmsId && !/^\d+$/.test(row.lmsId)) return fail('ID LMS harus angka')
    if (row.isNew) {
      if (!row.signed || !row.start || !row.end || !row.value) return fail('Kontrak pertama wajib diisi (tanda tangan, mulai, berakhir, nilai)')
      if (![row.signed, row.start, row.end].every((d) => DATE.test(d))) return fail('Format tanggal harus YYYY-MM-DD')
      const periodError = validatePeriod(row.start, row.end)
      if (periodError) return fail(periodError)
    }
    row.ok = true
    if (row.isNew) row.message = `Valid • kontrak pertama ${formatRupiah(row.value)}`
    else {
      const changed = [row.address && 'alamat', row.pic && 'PIC'].filter(Boolean).join(' dan ')
      row.message = `Valid • ${changed ? `${changed} diperbarui` : 'data diperbarui'}`
    }
    return row
  })
  return { rows, fileError: '' }
}

export interface ImportSummary { total: number; created: number; updated: number; failed: number }
export function summarize(rows: ImportRow[]): ImportSummary {
  return {
    total: rows.length,
    created: rows.filter((r) => r.ok && r.isNew).length,
    updated: rows.filter((r) => r.ok && !r.isNew).length,
    failed: rows.filter((r) => !r.ok).length,
  }
}
export const asZone = (z: string): IndoTimezone => (z === 'WITA' || z === 'WIT' ? z : 'WIB')

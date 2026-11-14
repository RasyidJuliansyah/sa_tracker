import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { parseCsv } from '../utils/csv.js'
import { AppError } from '../utils/errors.js'
import { isDateKey } from '../utils/timezone.js'
import { withAudit } from './audit.js'

type Ctx = { ip?: string; userAgent?: string }

export const IMPORT_COLUMNS = ['npsn', 'nama_sekolah', 'jenjang', 'paket', 'zona_waktu', 'kota', 'alamat', 'pic', 'kontak_pic', 'id_lms', 'tanggal_ttd', 'tanggal_mulai', 'tanggal_berakhir', 'nilai_kontrak'] as const
export const MAX_IMPORT_ROWS = 2000

export interface ImportRow {
  line: number; npsn: string; name: string; level: string; pkg: string; timezone: string; city: string; address: string; pic: string; picContact: string
  lmsId: string; signed: string; start: string; end: string; value: number; isNew: boolean; ok: boolean; message: string
  jenjangId?: number; packageId?: number; schoolId?: number
}

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`
const zone = (z: string): 'WIB' | 'WITA' | 'WIT' => (z === 'WITA' || z === 'WIT' ? z : 'WIB')

export function templateCsv(): string {
  const sample = ['10000099', 'SMA Contoh Bandung', 'SMA', 'Standar', 'WIB', 'Bandung', 'Jl. Contoh No. 1', 'Ibu Rina', '0812-0000-0000', '', '2026-11-01', '2026-12-01', '2027-11-30', '60000000']
  return '﻿' + [IMPORT_COLUMNS.join(','), sample.join(',')].join('\r\n') + '\r\n'
}

/** Validasi tanpa menyimpan. Sumber kebenaran: server (UI hanya menampilkan). */
export async function previewImport(csv: string): Promise<{ rows: ImportRow[]; fileError: string }> {
  const table = parseCsv(csv)
  if (table.length < 2) return { rows: [], fileError: 'File kosong atau tidak berisi baris data.' }
  if (table.length - 1 > MAX_IMPORT_ROWS) return { rows: [], fileError: `Maksimal ${MAX_IMPORT_ROWS} baris per impor.` }
  const header = table[0]!.map((h) => h.trim().toLowerCase())
  const missing = (['npsn', 'nama_sekolah', 'jenjang', 'paket'] as const).filter((h) => !header.includes(h))
  if (missing.length) return { rows: [], fileError: `Kolom wajib tidak ada: ${missing.join(', ')}. Unduh template untuk format yang benar.` }
  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? '').trim()

  const [jenjang, packages, schools] = await Promise.all([
    prisma.jenjang.findMany({ where: { isActive: true } }), prisma.package.findMany({ where: { isActive: true } }),
    prisma.school.findMany({ select: { id: true, npsn: true, lmsSchoolId: true } }),
  ])
  const byNpsn = new Map(schools.map((s) => [s.npsn, s]))
  const lmsOwner = new Map(schools.filter((s) => s.lmsSchoolId).map((s) => [String(s.lmsSchoolId), s.id]))
  const find = (items: { id: number; name: string }[], n: string) => items.find((i) => i.name.toLowerCase() === n.toLowerCase())

  const seen = new Set<string>()
  const rows = table.slice(1).map((r, i): ImportRow => {
    const row: ImportRow = {
      line: i + 2, npsn: col(r, 'npsn'), name: col(r, 'nama_sekolah'), level: col(r, 'jenjang'), pkg: col(r, 'paket'),
      timezone: col(r, 'zona_waktu') || 'WIB', city: col(r, 'kota'), address: col(r, 'alamat'), pic: col(r, 'pic'), picContact: col(r, 'kontak_pic'),
      lmsId: col(r, 'id_lms'), signed: col(r, 'tanggal_ttd'), start: col(r, 'tanggal_mulai'), end: col(r, 'tanggal_berakhir'),
      value: 0, isNew: false, ok: false, message: '',
    }
    const rawValue = col(r, 'nilai_kontrak')
    // Hanya angka, boleh dengan titik/spasi pemisah ribuan. Koma/desimal ditolak agar nilai tidak salah baca diam-diam.
    const valueOk = rawValue === '' || /^\d{1,3}([. ]\d{3})+$|^\d+$/.test(rawValue)
    if (valueOk) row.value = Number(rawValue.replace(/[. ]/g, '')) || 0
    const existing = byNpsn.get(row.npsn)
    row.isNew = !!row.npsn && !existing
    row.schoolId = existing?.id
    const fail = (m: string) => { row.message = m; return row }
    if (!row.npsn) return fail('NPSN wajib diisi')
    if (!/^\d{8}$/.test(row.npsn)) return fail('NPSN harus 8 digit angka')
    if (seen.has(row.npsn)) return fail(`NPSN ${row.npsn} ganda di file ini`)
    seen.add(row.npsn)
    if (!row.name) return fail('Nama sekolah wajib diisi')
    const tooLong = ([['Nama sekolah', row.name, 200], ['Kota', row.city, 100], ['Alamat', row.address, 255], ['PIC', row.pic, 120], ['Kontak PIC', row.picContact, 60]] as const).find(([, v, n]) => v.length > n)
    if (tooLong) return fail(`${tooLong[0]} maksimal ${tooLong[2]} karakter`)
    if (!valueOk) return fail('Nilai kontrak harus berupa angka (boleh titik pemisah ribuan), tanpa koma atau desimal')
    if (row.value > 9_999_999_999_999) return fail('Nilai kontrak terlalu besar')
    const jj = find(jenjang, row.level)
    if (!jj) return fail(`Jenjang "${row.level}" tidak ada di master jenjang`)
    const pk = find(packages, row.pkg)
    if (!pk) return fail(`Paket "${row.pkg}" tidak ada di master paket`)
    row.jenjangId = jj.id
    row.packageId = pk.id
    if (row.lmsId) {
      if (!/^\d+$/.test(row.lmsId)) return fail('ID LMS harus angka')
      const owner = lmsOwner.get(row.lmsId)
      if (owner && owner !== existing?.id) return fail(`ID LMS ${row.lmsId} sudah dipakai sekolah lain`)
    }
    if (row.isNew) {
      if (!row.signed || !row.start || !row.end || !row.value) return fail('Kontrak pertama wajib diisi (tanda tangan, mulai, berakhir, nilai)')
      if (![row.signed, row.start, row.end].every(isDateKey)) return fail('Format tanggal harus YYYY-MM-DD')
      if (row.end <= row.start) return fail('Tanggal berakhir harus setelah tanggal mulai')
    }
    row.ok = true
    if (row.isNew) row.message = `Valid • kontrak pertama ${rupiah(row.value)}`
    else {
      const changed = [row.address && 'alamat', row.pic && 'PIC'].filter(Boolean).join(' dan ')
      row.message = `Valid • ${changed ? `${changed} diperbarui` : 'data diperbarui'}`
    }
    return row
  })
  return { rows, fileError: '' }
}

/** Simpan baris valid. Satu transaksi per baris (+ audit IMPORT per baris); baris gagal dilaporkan, tidak membatalkan yang lain. */
export async function commitImport(actor: AuthUser, csv: string, ctx: Ctx) {
  const { rows, fileError } = await previewImport(csv)
  if (fileError) throw new AppError('VALIDATION', fileError)
  let created = 0, updated = 0
  const failed: { line: number; message: string }[] = rows.filter((r) => !r.ok).map((r) => ({ line: r.line, message: r.message }))
  for (const r of rows.filter((x) => x.ok)) {
    try {
      await withAudit(async (tx) => {
        if (r.isNew) {
          const s = await tx.school.create({ data: {
            npsn: r.npsn, name: r.name, jenjangId: r.jenjangId!, packageId: r.packageId!, timezone: zone(r.timezone), city: r.city || null, address: r.address || null,
            picName: r.pic || null, picContact: r.picContact || null, lmsSchoolId: r.lmsId ? Number(r.lmsId) : null, partnershipStartDate: new Date(`${r.start}T00:00:00Z`),
          } })
          const c = await tx.schoolContract.create({ data: { schoolId: s.id, contractType: 'NEW', signedDate: new Date(`${r.signed}T00:00:00Z`), contractStartDate: new Date(`${r.start}T00:00:00Z`), contractEndDate: new Date(`${r.end}T00:00:00Z`), contractValue: r.value, createdById: actor.id } })
          return { result: null, audit: [
            { actorId: actor.id, action: 'IMPORT' as const, entityType: 'school', entityId: s.id, changes: { line: r.line, created: true, after: { npsn: r.npsn, name: r.name } }, ...ctx },
            { actorId: actor.id, action: 'IMPORT' as const, entityType: 'contract', entityId: c.id, changes: { schoolId: s.id, line: r.line, created: true, after: { value: r.value, start: r.start, end: r.end } }, ...ctx },
          ] }
        }
        const data = { name: r.name, jenjangId: r.jenjangId!, packageId: r.packageId!, ...(r.timezone && { timezone: zone(r.timezone) }), ...(r.city && { city: r.city }), ...(r.address && { address: r.address }), ...(r.pic && { picName: r.pic }), ...(r.picContact && { picContact: r.picContact }), ...(r.lmsId && { lmsSchoolId: Number(r.lmsId) }) }
        await tx.school.update({ where: { id: r.schoolId! }, data })
        return { result: null, audit: { actorId: actor.id, action: 'IMPORT' as const, entityType: 'school', entityId: r.schoolId!, changes: { line: r.line, updated: true, after: data }, ...ctx } }
      })
      if (r.isNew) created++
      else updated++
    } catch (e) {
      failed.push({ line: r.line, message: e instanceof AppError ? e.message : 'Gagal menyimpan baris ini' })
    }
  }
  await withAudit(async () => ({ result: null, audit: { actorId: actor.id, action: 'IMPORT', entityType: 'import', entityId: null, changes: { created, updated, failed: failed.length, rows: rows.length }, ...ctx } }))
  return { created, updated, failed }
}

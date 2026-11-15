import bcrypt from 'bcrypt'
import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { parseCsv } from '../utils/csv.js'
import { AppError } from '../utils/errors.js'
import { generateTempPassword } from '../utils/password.js'
import { withAudit } from './audit.js'

type Ctx = { ip?: string; userAgent?: string }
type Role = 'ADMIN' | 'MANAGER' | 'AGENT'
type Tz = 'WIB' | 'WITA' | 'WIT'

/** Biaya bcrypt untuk password baru (tes bisa menurunkan lewat BCRYPT_COST). */
const BCRYPT_COST = Number(process.env.BCRYPT_COST ?? 12)

export const IMPORT_COLUMNS = ['nama', 'email', 'peran', 'zona_waktu', 'password'] as const
export const MAX_IMPORT_ROWS = 2000
const ROLES: Role[] = ['ADMIN', 'MANAGER', 'AGENT']
const asRole = (v: string): Role | null => ROLES.find((r) => r === v.toUpperCase()) ?? null
const asZone = (v: string): Tz => (v.toUpperCase() === 'WITA' || v.toUpperCase() === 'WIT' ? (v.toUpperCase() as Tz) : 'WIB')

export interface AccountImportRow {
  line: number; name: string; email: string; role: string; timezone: string; password: string
  isNew: boolean; ok: boolean; message: string; existingId?: number
}

export function templateCsv(): string {
  const sample = ['Contoh Pengguna', 'contoh.pengguna@skolla.id', 'AGENT', 'WIB', '']
  return '\ufeff' + [IMPORT_COLUMNS.join(','), sample.join(',')].join('\r\n') + '\r\n'
}

/** Validasi tanpa menyimpan. Sumber kebenaran: server (UI hanya menampilkan). */
export async function previewImport(csv: string): Promise<{ rows: AccountImportRow[]; fileError: string }> {
  const table = parseCsv(csv)
  if (table.length < 2) return { rows: [], fileError: 'File kosong atau tidak berisi baris data.' }
  if (table.length - 1 > MAX_IMPORT_ROWS) return { rows: [], fileError: `Maksimal ${MAX_IMPORT_ROWS} baris per impor.` }
  const header = table[0]!.map((h) => h.trim().toLowerCase())
  const missing = (['nama', 'email', 'peran'] as const).filter((h) => !header.includes(h))
  if (missing.length) return { rows: [], fileError: `Kolom wajib tidak ada: ${missing.join(', ')}. Unduh template untuk format yang benar.` }
  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? '').trim()

  const existing = await prisma.user.findMany({ select: { id: true, email: true } })
  const byEmail = new Map(existing.map((u) => [u.email, u.id]))

  const seen = new Set<string>()
  const rows = table.slice(1).map((r, i): AccountImportRow => {
    const row: AccountImportRow = {
      line: i + 2, name: col(r, 'nama'), email: col(r, 'email').toLowerCase(), role: col(r, 'peran'),
      timezone: col(r, 'zona_waktu') || 'WIB', password: col(r, 'password'), isNew: false, ok: false, message: '',
    }
    row.isNew = !!row.email && !byEmail.has(row.email)
    row.existingId = byEmail.get(row.email)
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

/** Simpan baris valid. Satu transaksi per baris (+ audit per baris); baris gagal dilaporkan, tidak membatalkan yang lain. */
export async function commitImport(actor: AuthUser, csv: string, ctx: Ctx) {
  const { rows, fileError } = await previewImport(csv)
  if (fileError) throw new AppError('VALIDATION', fileError)
  let created = 0, updated = 0
  const failed: { line: number; message: string }[] = rows.filter((r) => !r.ok).map((r) => ({ line: r.line, message: r.message }))
  for (const r of rows.filter((x) => x.ok)) {
    try {
      if (!r.isNew && r.existingId === actor.id) throw new AppError('FORBIDDEN', 'Tidak bisa mengubah akun sendiri lewat impor')
      await withAudit(async (tx) => {
        const role = asRole(r.role)!
        if (r.isNew) {
          const tempPassword = r.password || generateTempPassword()
          const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_COST)
          const u = await tx.user.create({ data: { name: r.name, email: r.email, role, timezone: asZone(r.timezone), passwordHash, mustChangePassword: true, createdById: actor.id } })
          return { result: null, audit: { actorId: actor.id, action: 'CREATE' as const, entityType: 'user', entityId: u.id, changes: { line: r.line, created: true, after: { name: r.name, email: r.email, role } }, ...ctx } }
        }
        const u = await tx.user.update({ where: { id: r.existingId! }, data: { name: r.name, role, timezone: asZone(r.timezone) } })
        return { result: null, audit: { actorId: actor.id, action: 'UPDATE' as const, entityType: 'user', entityId: u.id, changes: { line: r.line, updated: true, after: { name: r.name, role } }, ...ctx } }
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

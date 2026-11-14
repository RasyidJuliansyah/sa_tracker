import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { toCsv } from '../utils/csv.js'
import { endOfDayExclusiveUtc, startOfDayUtc } from '../utils/timezone.js'
import { withAudit } from './audit.js'
import { retainedFor, type ContractRow } from './retention.js'
import { listSchools } from './school.service.js'

type Ctx = { ip?: string; userAgent?: string }
export interface CsvResult { content: string; rows: number }
const MAX_EXPORT_ROWS = 50_000
const dk = (d: Date) => d.toISOString().slice(0, 10)
const wibDate = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10)
const wibTime = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(11, 16)

export async function buildSchoolsCsv(actor: AuthUser, f: { jenjangId?: number; status?: string }): Promise<CsvResult> {
  const { items } = await listSchools(actor, { jenjangId: f.jenjangId, status: f.status, page: 1, pageSize: 100_000 })
  const body = items.map((s) => [s.npsn, s.name, s.jenjang.name, s.package.name, s.city ?? '', s.agent?.name ?? '', s.contract ? `${s.contract.start} s.d. ${s.contract.end}` : '', s.contract?.value ?? '', s.status?.kind ?? ''])
  return { content: toCsv(['NPSN', 'Nama sekolah', 'Jenjang', 'Paket', 'Kota', 'Agent', 'Kontrak berjalan', 'Nilai kontrak', 'Status perpanjangan'], body), rows: body.length }
}

export async function buildContractsCsv(f: { year: number; agentId?: number }): Promise<CsvResult> {
  const rows = await prisma.schoolContract.findMany({ include: { school: { select: { name: true, assignments: { where: { unassignedAt: null }, select: { agentId: true } } } } } })
  const lite: ContractRow[] = rows.map((c) => ({ id: c.id, schoolId: c.schoolId, endDate: dk(c.contractEndDate), value: Number(c.contractValue), previousContractId: c.previousContractId, type: c.contractType, signedDate: c.signedDate ? dk(c.signedDate) : null }))
  const body = rows
    .filter((c) => c.contractEndDate.getUTCFullYear() === f.year && (!f.agentId || c.school.assignments.some((a) => a.agentId === f.agentId)))
    .map((c) => {
      const row = lite.find((x) => x.id === c.id)!
      const next = retainedFor(row, lite)
      return [c.school.name, `Kontrak ${dk(c.contractStartDate).slice(0, 4)}`, dk(c.contractStartDate), dk(c.contractEndDate), Number(c.contractValue), next || '', next ? ((next / Number(c.contractValue)) * 100).toFixed(1) : '']
    })
  return { content: toCsv(['Sekolah', 'Kontrak', 'Mulai', 'Berakhir', 'Nilai kontrak', 'Nilai perpanjangan', 'Retention (%)'], body), rows: body.length }
}

export async function buildVisitsCsv(f: { from?: string; to?: string; agentId?: number }): Promise<CsvResult> {
  const visits = await prisma.visit.findMany({
    where: { ...(f.agentId ? { agentId: f.agentId } : {}), ...((f.from || f.to) && { checkInAt: { ...(f.from && { gte: startOfDayUtc(f.from) }), ...(f.to && { lt: endOfDayExclusiveUtc(f.to) }) } }) },
    include: { agent: { select: { name: true } }, school: { select: { name: true } } }, orderBy: { checkInAt: 'desc' }, take: MAX_EXPORT_ROWS,
  })
  const body = visits.map((v) => [wibDate(v.checkInAt), v.agent.name, v.school.name, wibTime(v.checkInAt), v.checkOutAt ? wibTime(v.checkOutAt) : '', v.checkOutAt ? Math.round((v.checkOutAt.getTime() - v.checkInAt.getTime()) / 60000) : '', v.report ?? ''])
  return { content: toCsv(['Tanggal (WIB)', 'Agent', 'Sekolah', 'Check-in (WIB)', 'Check-out (WIB)', 'Durasi (menit)', 'Laporan'], body), rows: body.length }
}

/** Catat ekspor di audit log (jenis, filter, jumlah baris). */
export async function logExport(actor: AuthUser, kind: string, filter: string, rows: number, ctx: Ctx) {
  await withAudit(async () => ({ result: null, audit: { actorId: actor.id, action: 'EXPORT', entityType: 'export', entityId: null, changes: { kind, filter, rows }, ...ctx } }))
}

export async function exportLog() {
  const rows = await prisma.auditLog.findMany({ where: { action: 'EXPORT' }, orderBy: { id: 'desc' }, take: 50, include: { actor: { select: { name: true } } } })
  return rows.map((r) => {
    const c = (r.changes ?? {}) as { kind?: string; filter?: string; rows?: number }
    return { id: r.id, at: r.createdAt.toISOString(), actor: r.actor?.name ?? 'Tidak dikenal', kind: c.kind ?? '', filter: c.filter ?? '', rows: c.rows ?? 0 }
  })
}

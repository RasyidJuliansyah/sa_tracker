import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { AppError } from '../utils/errors.js'
import { dateKeyIn, endOfDayExclusiveUtc, startOfDayUtc } from '../utils/timezone.js'
import { withAudit } from './audit.js'
import { deletePhoto, savePhoto } from './photo-storage.js'
import { checkInRejectionReason } from './visit-plan-rules.js'
import { checkInEligibility } from './visit-plan.service.js'

type Ctx = { ip?: string; userAgent?: string }

const include = { agent: { select: { id: true, name: true } }, school: { select: { id: true, name: true, assignments: { where: { unassignedAt: null }, select: { agentId: true } } } }, plan: { select: { id: true, purpose: true, createdById: true, agentId: true } } } as const
type VisitFull = Awaited<ReturnType<typeof loadOne>> & object
const loadOne = (id: number) => prisma.visit.findUnique({ where: { id }, include })

export const toVisit = (v: NonNullable<VisitFull>) => ({
  id: v.id, agentId: v.agentId, agentName: v.agent.name, schoolId: v.schoolId, schoolName: v.school.name,
  assigned: v.school.assignments.some((a) => a.agentId === v.agentId),
  timezone: v.timezone, checkInAt: v.checkInAt.toISOString(), checkOutAt: v.checkOutAt?.toISOString() ?? null,
  durationMinutes: v.checkOutAt ? Math.round((v.checkOutAt.getTime() - v.checkInAt.getTime()) / 60000) : null,
  status: v.status, report: v.report, accuracyM: v.checkInAccuracy, lat: Number(v.checkInLat), lng: Number(v.checkInLng), hasPhoto: true,
  plan: v.plan ? { id: v.plan.id, purpose: v.plan.purpose, source: v.plan.createdById === v.plan.agentId ? ('SELF' as const) : ('MANAGER' as const) } : null,
})

/** Check-in: jam dari server, satu kunjungan ONGOING per agent (dikunci di transaksi), foto wajib. */
export async function checkIn(actor: AuthUser, input: { schoolId: number; lat: number; lng: number; accuracy: number | null }, photo: Buffer | undefined, ctx: Ctx, now = new Date()) {
  if (!photo) throw new AppError('VALIDATION', 'Foto kunjungan wajib diunggah.')
  const school = await prisma.school.findUnique({ where: { id: input.schoolId }, select: { id: true } })
  if (!school) throw new AppError('NOT_FOUND', 'Sekolah tidak ditemukan.')
  // Pembatasan check-in (FR-13/14): hanya sekolah yang ditugaskan atau punya rencana terjadwal hari ini (WIB).
  // Tolak lebih awal, sebelum menulis foto ke disk; penegakan sesungguhnya diulang di transaksi.
  const todayWib = dateKeyIn(now)
  const elig = await checkInEligibility(actor.id, input.schoolId, todayWib)
  const reason = checkInRejectionReason(elig)
  if (reason) throw new AppError('FORBIDDEN', reason)
  if ((await prisma.visit.count({ where: { agentId: actor.id, status: 'ONGOING' } })) > 0) throw new AppError('CONFLICT', 'Anda masih punya kunjungan yang berlangsung. Check-out dulu.')
  const rel = await savePhoto(photo, now)
  try {
    const id = await withAudit(async (tx) => {
      await tx.$queryRaw`SELECT user_id FROM users WHERE user_id = ${actor.id} FOR UPDATE`
      if ((await tx.visit.count({ where: { agentId: actor.id, status: 'ONGOING' } })) > 0) throw new AppError('CONFLICT', 'Anda masih punya kunjungan yang berlangsung. Check-out dulu.')
      // Ulangi cek izin di transaksi; ambil rencana yang bisa dihubungkan (FR-15).
      const e = await checkInEligibility(actor.id, input.schoolId, todayWib, tx)
      const r = checkInRejectionReason(e)
      if (r) throw new AppError('FORBIDDEN', r)
      const v = await tx.visit.create({ data: { agentId: actor.id, schoolId: input.schoolId, timezone: actor.timezone, checkInAt: now, checkInLat: input.lat, checkInLng: input.lng, checkInAccuracy: input.accuracy, photoPath: rel, status: 'ONGOING', planId: e.approvedPlanId ?? undefined } })
      // Koordinat tidak ditulis ke audit (data sensitif).
      return { result: v.id, audit: { actorId: actor.id, action: 'CHECK_IN', entityType: 'visit', entityId: v.id, changes: { schoolId: input.schoolId, planId: e.approvedPlanId ?? null }, ...ctx } }
    })
    return toVisit((await loadOne(id))!)
  } catch (e) {
    await deletePhoto(rel)
    throw e
  }
}

export async function checkOut(actor: AuthUser, visitId: number, report: string, ctx: Ctx, now = new Date()) {
  const text = report.trim()
  if (!text) throw new AppError('VALIDATION', 'Laporan kunjungan wajib diisi.')
  const v = await prisma.visit.findUnique({ where: { id: visitId } })
  if (!v || v.agentId !== actor.id) throw new AppError('NOT_FOUND', 'Kunjungan tidak ditemukan.')
  await withAudit(async (tx) => {
    const done = await tx.visit.updateMany({ where: { id: visitId, status: 'ONGOING' }, data: { status: 'DONE', checkOutAt: now, report: text } })
    if (done.count === 0) throw new AppError('CONFLICT', 'Kunjungan ini sudah di-check-out.')
    return { result: null, audit: { actorId: actor.id, action: 'CHECK_OUT', entityType: 'visit', entityId: visitId, changes: { schoolId: v.schoolId }, ...ctx } }
  })
  return toVisit((await loadOne(visitId))!)
}

export async function getVisit(actor: AuthUser, id: number) {
  const v = await loadOne(id)
  if (!v || (actor.role === 'AGENT' && v.agentId !== actor.id)) throw new AppError('NOT_FOUND', 'Kunjungan tidak ditemukan.')
  return toVisit(v)
}

export async function listVisits(actor: AuthUser, f: { from?: string; to?: string; agentId?: number; schoolId?: number; status?: 'ONGOING' | 'DONE'; page: number; pageSize: number }) {
  const where = {
    ...(actor.role === 'AGENT' ? { agentId: actor.id } : f.agentId ? { agentId: f.agentId } : {}),
    ...(f.schoolId ? { schoolId: f.schoolId } : {}), ...(f.status ? { status: f.status } : {}),
    ...((f.from || f.to) && { checkInAt: { ...(f.from && { gte: startOfDayUtc(f.from) }), ...(f.to && { lt: endOfDayExclusiveUtc(f.to) }) } }),
  }
  const [total, rows] = await Promise.all([
    prisma.visit.count({ where }),
    prisma.visit.findMany({ where, include, orderBy: { checkInAt: 'desc' }, skip: (f.page - 1) * f.pageSize, take: f.pageSize }),
  ])
  return { total, items: rows.map(toVisit) }
}

/** Path foto untuk rute unduh; sama aturan aksesnya dengan getVisit. */
export async function photoPathFor(actor: AuthUser, id: number): Promise<string> {
  const v = await prisma.visit.findUnique({ where: { id }, select: { agentId: true, photoPath: true } })
  if (!v || (actor.role === 'AGENT' && v.agentId !== actor.id)) throw new AppError('NOT_FOUND', 'Foto tidak ditemukan.')
  return v.photoPath
}

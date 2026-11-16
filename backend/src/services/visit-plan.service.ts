import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { AppError } from '../utils/errors.js'
import { dateKeyIn } from '../utils/timezone.js'
import { withAudit, type Tx } from './audit.js'
import { currentContract } from './contract-rules.js'
import {
  derivePlanStatus,
  validatePlanDate,
  validatePurpose,
  type LinkedVisitStatus,
} from './visit-plan-rules.js'

type Ctx = { ip?: string; userAgent?: string }

const dk = (d: Date) => d.toISOString().slice(0, 10)
const toDate = (k: string) => new Date(`${k}T00:00:00Z`)

const include = {
  agent: { select: { id: true, name: true } },
  school: { select: { id: true, name: true, npsn: true, city: true } },
  decidedBy: { select: { id: true, name: true } },
  visit: { select: { id: true, status: true } },
} as const
type PlanFull = NonNullable<Awaited<ReturnType<typeof loadOne>>>
const loadOne = (id: number) => prisma.visitPlan.findUnique({ where: { id }, include })

/** Bentuk DTO rencana, dengan status turunan (Selesai/Terlewat/Kedaluwarsa). */
export function toPlan(p: PlanFull, todayWib: string) {
  const linked: LinkedVisitStatus = p.visit ? p.visit.status : null
  return {
    id: p.id,
    agentId: p.agentId,
    agentName: p.agent.name,
    schoolId: p.schoolId,
    schoolName: p.school.name,
    npsn: p.school.npsn,
    city: p.school.city ?? '',
    planDate: dk(p.planDate),
    purpose: p.purpose,
    source: p.createdById === p.agentId ? ('SELF' as const) : ('MANAGER' as const),
    storedStatus: p.status,
    status: derivePlanStatus({ status: p.status, planDate: dk(p.planDate), linkedVisit: linked }, todayWib),
    decidedBy: p.decidedBy?.name ?? null,
    decidedAt: p.decidedAt?.toISOString() ?? null,
    decisionNote: p.decisionNote,
    visitId: p.visit?.id ?? null,
    createdAt: p.createdAt.toISOString(),
  }
}

/** Apakah sekolah sedang ditugaskan kepada agent (penugasan aktif). */
async function isAssigned(agentId: number, schoolId: number, db: Tx | typeof prisma = prisma): Promise<boolean> {
  const n = await db.schoolAssignment.count({ where: { schoolId, agentId, unassignedAt: null } })
  return n > 0
}

/**
 * Kelayakan check-in agent di sekolah pada tanggal WIB tertentu (FR-13).
 * `approvedPlanId` = rencana APPROVED tanpa kunjungan yang bisa dihubungkan (FR-15).
 */
export async function checkInEligibility(
  agentId: number,
  schoolId: number,
  dateWib: string,
  db: Tx | typeof prisma = prisma,
): Promise<{ assigned: boolean; hasApprovedPlanToday: boolean; hasPendingPlanToday: boolean; approvedPlanId: number | null }> {
  const [assigned, approved, pending] = await Promise.all([
    isAssigned(agentId, schoolId, db),
    db.visitPlan.findFirst({
      where: { agentId, schoolId, planDate: toDate(dateWib), status: 'APPROVED', visit: { is: null } },
      select: { id: true },
    }),
    db.visitPlan.count({ where: { agentId, schoolId, planDate: toDate(dateWib), status: 'PENDING' } }),
  ])
  return { assigned, hasApprovedPlanToday: !!approved, hasPendingPlanToday: pending > 0, approvedPlanId: approved?.id ?? null }
}

interface CreateInput {
  agentId?: number // diabaikan untuk AGENT (selalu dirinya)
  schoolId: number
  planDate: string
  purpose: string
}

/**
 * Buat rencana. AGENT membuat untuk dirinya; MANAGER/ADMIN membuat jadwal untuk agent.
 * Status awal (docs/prd-rencana-kunjungan.md, Status rencana):
 * - dibuat manager/admin  -> APPROVED (pemutus = pembuat)
 * - agent + sekolah ditugaskan kepadanya -> APPROVED (tanpa pemutus)
 * - agent + sekolah lain  -> PENDING (pengajuan)
 */
export async function createPlan(actor: AuthUser, input: CreateInput, ctx: Ctx, now = new Date()) {
  const todayWib = dateKeyIn(now)
  const byManager = actor.role === 'MANAGER' || actor.role === 'ADMIN'
  const agentId = byManager ? input.agentId : actor.id
  if (!agentId) throw new AppError('VALIDATION', 'Agent wajib dipilih.')
  validatePlanDate(input.planDate, todayWib)
  const purpose = validatePurpose(input.purpose)

  const [agent, school] = await Promise.all([
    prisma.user.findUnique({ where: { id: agentId }, select: { id: true, role: true, isActive: true } }),
    prisma.school.findUnique({ where: { id: input.schoolId }, select: { id: true } }),
  ])
  if (!agent || agent.role !== 'AGENT' || !agent.isActive) throw new AppError('VALIDATION', 'Agent tidak valid.')
  if (!school) throw new AppError('NOT_FOUND', 'Sekolah tidak ditemukan.')

  const assigned = await isAssigned(agentId, input.schoolId)
  const status = byManager || assigned ? 'APPROVED' : 'PENDING'

  const id = await withAudit(async (tx) => {
    // Satu rencana aktif (PENDING/APPROVED) per agent+sekolah+tanggal (FR-5).
    await tx.$queryRaw`SELECT user_id FROM users WHERE user_id = ${agentId} FOR UPDATE`
    const dupe = await tx.visitPlan.count({
      where: { agentId, schoolId: input.schoolId, planDate: toDate(input.planDate), status: { in: ['PENDING', 'APPROVED'] } },
    })
    if (dupe > 0) throw new AppError('CONFLICT', 'Sudah ada rencana aktif untuk sekolah dan tanggal ini.')
    const p = await tx.visitPlan.create({
      data: {
        agentId,
        schoolId: input.schoolId,
        planDate: toDate(input.planDate),
        purpose,
        status,
        createdById: actor.id,
        decidedById: byManager ? actor.id : null,
        decidedAt: byManager ? now : null,
      },
    })
    return {
      result: p.id,
      audit: { actorId: actor.id, action: 'CREATE' as const, entityType: 'visit_plan', entityId: p.id, changes: { agentId, schoolId: input.schoolId, planDate: input.planDate, status }, ...ctx },
    }
  })
  return toPlan((await loadOne(id))!, todayWib)
}

interface ListFilter {
  from?: string
  to?: string
  agentId?: number
  schoolId?: number
  source?: 'SELF' | 'MANAGER'
  /** true = hanya Mendatang (Terjadwal/Menunggu), false = hanya Riwayat. undefined = semua. */
  upcoming?: boolean
}

/** Daftar rencana. AGENT hanya melihat miliknya sendiri. Status turunan dihitung di JS. */
export async function listPlans(actor: AuthUser, f: ListFilter, now = new Date()) {
  const todayWib = dateKeyIn(now)
  const where = {
    ...(actor.role === 'AGENT' ? { agentId: actor.id } : f.agentId ? { agentId: f.agentId } : {}),
    ...(f.schoolId ? { schoolId: f.schoolId } : {}),
    ...((f.from || f.to) && { planDate: { ...(f.from && { gte: toDate(f.from) }), ...(f.to && { lte: toDate(f.to) }) } }),
  }
  const rows = await prisma.visitPlan.findMany({ where, include, orderBy: [{ planDate: 'desc' }, { id: 'desc' }], take: 500 })
  let items = rows.map((r) => toPlan(r, todayWib))
  if (f.source) items = items.filter((p) => p.source === f.source)
  if (f.upcoming === true) items = items.filter((p) => p.status === 'APPROVED' || p.status === 'PENDING')
  if (f.upcoming === false) items = items.filter((p) => p.status !== 'APPROVED' && p.status !== 'PENDING')
  return { total: items.length, items }
}

export async function getPlan(actor: AuthUser, id: number, now = new Date()) {
  const p = await loadOne(id)
  if (!p || (actor.role === 'AGENT' && p.agentId !== actor.id)) throw new AppError('NOT_FOUND', 'Rencana tidak ditemukan.')
  return toPlan(p, dateKeyIn(now))
}

/**
 * Detail pengajuan untuk pemutus (FR-9): profil sekolah, agent yang sedang memegangnya,
 * kontrak berjalan, dan 5 kunjungan terakhir ke sekolah itu oleh agent mana pun.
 */
export async function getPlanForDecision(id: number, now = new Date()) {
  const p = await loadOne(id)
  if (!p) throw new AppError('NOT_FOUND', 'Rencana tidak ditemukan.')
  const [school, holder, lastVisits] = await Promise.all([
    prisma.school.findUnique({
      where: { id: p.schoolId },
      include: { jenjang: true, package: true, contracts: true },
    }),
    prisma.schoolAssignment.findFirst({ where: { schoolId: p.schoolId, unassignedAt: null }, include: { agent: { select: { id: true, name: true } } } }),
    prisma.visit.findMany({
      where: { schoolId: p.schoolId },
      orderBy: { checkInAt: 'desc' },
      take: 5,
      include: { agent: { select: { id: true, name: true } } },
    }),
  ])
  const todayWib = dateKeyIn(now)
  const current = school ? currentContract(school.contracts.map((c) => ({ id: c.id, startDate: dk(c.contractStartDate)!, endDate: dk(c.contractEndDate)!, previousContractId: c.previousContractId, raw: c })), todayWib) : null
  return {
    plan: toPlan(p, todayWib),
    school: school ? {
      id: school.id, name: school.name, npsn: school.npsn, jenjang: school.jenjang.name, package: school.package.name,
      city: school.city, address: school.address, picName: school.picName, picContact: school.picContact,
    } : null,
    holder: holder ? { id: holder.agent.id, name: holder.agent.name } : null,
    currentContract: current ? { id: current.raw.id, start: dk(current.raw.contractStartDate)!, end: dk(current.raw.contractEndDate)!, value: Number(current.raw.contractValue) } : null,
    recentVisits: lastVisits.map((v) => ({ id: v.id, agentId: v.agent.id, agentName: v.agent.name, checkInAt: v.checkInAt.toISOString(), checkOutAt: v.checkOutAt?.toISOString() ?? null, status: v.status })),
  }
}

/**
 * Setujui atau tolak pengajuan menunggu (FR-10). Hanya ADMIN/MANAGER, hanya status PENDING,
 * dan hanya kalau tanggal rencana masih hari ini atau setelahnya (WIB). `note` wajib saat tolak.
 */
export async function decidePlan(actor: AuthUser, id: number, decision: 'APPROVE' | 'REJECT', note: string | null, ctx: Ctx, now = new Date()) {
  const p = await loadOne(id)
  if (!p) throw new AppError('NOT_FOUND', 'Rencana tidak ditemukan.')
  const todayWib = dateKeyIn(now)
  if (dk(p.planDate) < todayWib) throw new AppError('CONFLICT', 'Pengajuan ini sudah lewat tanggalnya, tidak bisa diputus.')
  const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  await withAudit(async (tx) => {
    const done = await tx.visitPlan.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: newStatus, decidedById: actor.id, decidedAt: now, decisionNote: note },
    })
    if (done.count === 0) throw new AppError('CONFLICT', 'Pengajuan ini sudah diputus pihak lain.')
    return {
      result: null,
      audit: { actorId: actor.id, action: decision as 'APPROVE' | 'REJECT', entityType: 'visit_plan', entityId: id, changes: { from: 'PENDING', to: newStatus, note }, ...ctx },
    }
  })
  return toPlan((await loadOne(id))!, todayWib)
}

/**
 * Batalkan rencana. Agent hanya boleh membatalkan rencananya sendiri (SELF), bukan jadwal dari manager.
 * Manager/admin boleh membatalkan rencana apa pun. Rencana yang sudah punya kunjungan tidak bisa dibatalkan.
 */
export async function cancelPlan(actor: AuthUser, id: number, ctx: Ctx, now = new Date()) {
  const p = await loadOne(id)
  if (!p || (actor.role === 'AGENT' && p.agentId !== actor.id)) throw new AppError('NOT_FOUND', 'Rencana tidak ditemukan.')
  if (actor.role === 'AGENT' && p.createdById !== actor.id) {
    throw new AppError('FORBIDDEN', 'Jadwal dari manager hanya bisa dibatalkan oleh manager.')
  }
  if (p.visit) throw new AppError('CONFLICT', 'Rencana ini sudah punya kunjungan, tidak bisa dibatalkan.')
  await withAudit(async (tx) => {
    const done = await tx.visitPlan.updateMany({ where: { id, status: { in: ['PENDING', 'APPROVED'] } }, data: { status: 'CANCELLED' } })
    if (done.count === 0) throw new AppError('CONFLICT', 'Rencana ini tidak bisa dibatalkan.')
    return { result: null, audit: { actorId: actor.id, action: 'CANCEL' as const, entityType: 'visit_plan', entityId: id, changes: { from: p.status }, ...ctx } }
  })
  return getPlan(actor, id, now)
}

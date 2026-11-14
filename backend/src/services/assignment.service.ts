import { MAX_AGENTS_PER_SCHOOL } from '../constants.js'
import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { AppError } from '../utils/errors.js'
import { withAudit } from './audit.js'
import { DEFAULT_TARGET_PERCENT, retentionForAgent } from './retention.js'
import { listSchools } from './school.service.js'
import { loadContractRows } from './target.service.js'
import { dateKeyIn } from '../utils/timezone.js'

type Ctx = { ip?: string; userAgent?: string }

/** Penugasan per agent aktif + sekolah tanpa agent. */
export async function listAssignments(actor: AuthUser) {
  const agents = await prisma.user.findMany({ where: { role: 'AGENT', isActive: true }, select: { id: true, name: true, timezone: true }, orderBy: { name: 'asc' } })
  const { items } = await listSchools(actor, { page: 1, pageSize: 200 })
  const today = dateKeyIn(new Date())
  const year = Number(today.slice(0, 4))
  const [contracts, active, target] = await Promise.all([
    loadContractRows(),
    prisma.schoolAssignment.findMany({ where: { unassignedAt: null }, select: { schoolId: true, agentId: true, sharePercent: true } }),
    prisma.retentionTarget.findUnique({ where: { year } }),
  ])
  const assignments = active.map((a) => ({ schoolId: a.schoolId, agentId: a.agentId, sharePercent: Number(a.sharePercent) }))
  const targetPercent = target ? Number(target.targetPercent) : DEFAULT_TARGET_PERCENT
  return {
    year,
    agents: agents.map((a) => ({ ...a, retention: retentionForAgent(contracts, assignments, a.id, year, today, targetPercent).percent ?? 0, schools: items.filter((s) => s.agent?.id === a.id) })),
    unassigned: items.filter((s) => !s.agent),
  }
}

/** Tugaskan atau pindahkan: tutup baris lama, buat baris baru, dalam satu transaksi. */
export async function assignSchool(actor: AuthUser, schoolId: number, agentId: number, ctx: Ctx) {
  const [school, agent] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: agentId } }),
  ])
  if (!school) throw new AppError('NOT_FOUND', 'Sekolah tidak ditemukan.')
  if (!agent || agent.role !== 'AGENT' || !agent.isActive) throw new AppError('VALIDATION', 'Agent tidak valid atau nonaktif.')
  return withAudit(async (tx) => {
    const current = await tx.schoolAssignment.findMany({ where: { schoolId, unassignedAt: null } })
    if (current.some((c) => c.agentId === agentId)) return { result: { changed: false }, audit: [] }
    const entries = []
    const now = new Date()
    if (current.length >= MAX_AGENTS_PER_SCHOOL) {
      for (const c of current) {
        await tx.schoolAssignment.update({ where: { id: c.id }, data: { unassignedAt: now } })
        entries.push({ actorId: actor.id, action: 'UNASSIGN' as const, entityType: 'assignment', entityId: c.id, changes: { schoolId, before: { agentId: c.agentId } }, ...ctx })
      }
    }
    const created = await tx.schoolAssignment.create({ data: { schoolId, agentId, assignedById: actor.id, sharePercent: 100, assignedAt: now } })
    entries.push({ actorId: actor.id, action: 'ASSIGN' as const, entityType: 'assignment', entityId: created.id, changes: { schoolId, after: { agentId, sharePercent: 100 } }, ...ctx })
    return { result: { changed: true }, audit: entries }
  })
}

import { prisma } from '../db.js'
import { endOfDayExclusiveUtc, startOfDayUtc } from '../utils/timezone.js'

export interface AuditQuery { entityType?: string; entityId?: number; action?: string; actorId?: number; from?: string; to?: string; page: number; pageSize: number }

export async function listAudit(q: AuditQuery) {
  const where = {
    ...(q.entityType && { entityType: q.entityType }),
    ...(q.entityId && { entityId: q.entityId }),
    ...(q.action && { action: q.action as never }),
    ...(q.actorId && { actorId: q.actorId }),
    ...((q.from || q.to) && { createdAt: { ...(q.from && { gte: startOfDayUtc(q.from) }), ...(q.to && { lt: endOfDayExclusiveUtc(q.to) }) } }),
  }
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { id: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, include: { actor: { select: { name: true, role: true } } } }),
  ])
  return {
    total,
    items: rows.map((r) => ({
      id: r.id, at: r.createdAt.toISOString(), action: r.action, entityType: r.entityType, entityId: r.entityId,
      actor: r.actor?.name ?? null, actorRole: r.actor?.role ?? null, changes: r.changes,
    })),
  }
}

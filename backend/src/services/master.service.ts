import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { AppError } from '../utils/errors.js'
import { withAudit } from './audit.js'

export type MasterKind = 'jenjang' | 'packages'
type Ctx = { ip?: string; userAgent?: string }

// Delegasi Prisma per jenis master; jumlah sekolah dihitung dari relasi.
const model = (k: MasterKind) => (k === 'jenjang' ? prisma.jenjang : prisma.package)
const entity = (k: MasterKind) => (k === 'jenjang' ? 'jenjang' : 'package')

export async function listMaster(kind: MasterKind) {
  const rows = await (model(kind) as any).findMany({ orderBy: { id: 'asc' }, include: { _count: { select: { schools: true } } } })
  return rows.map((r: any) => ({ id: r.id, name: r.name, active: r.isActive, schoolCount: r._count.schools }))
}

export async function createMaster(actor: AuthUser, kind: MasterKind, name: string, ctx: Ctx) {
  const n = name.trim()
  if (await (model(kind) as any).findUnique({ where: { name: n } })) throw new AppError('CONFLICT', 'Nama sudah dipakai.')
  return withAudit(async (tx) => {
    const r = await (tx as any)[kind === 'jenjang' ? 'jenjang' : 'package'].create({ data: { name: n } })
    return { result: { id: r.id, name: r.name, active: r.isActive, schoolCount: 0 }, audit: { actorId: actor.id, action: 'CREATE', entityType: entity(kind), entityId: r.id, changes: { after: { name: n } }, ...ctx } }
  })
}

export async function updateMaster(actor: AuthUser, kind: MasterKind, id: number, input: { name?: string; active?: boolean }, ctx: Ctx) {
  const before = await (model(kind) as any).findUnique({ where: { id } })
  if (!before) throw new AppError('NOT_FOUND', 'Data tidak ditemukan.')
  const name = input.name?.trim()
  if (name && name !== before.name && (await (model(kind) as any).findUnique({ where: { name } }))) throw new AppError('CONFLICT', 'Nama sudah dipakai.')
  return withAudit(async (tx) => {
    const r = await (tx as any)[kind === 'jenjang' ? 'jenjang' : 'package'].update({ where: { id }, data: { ...(name && { name }), ...(input.active !== undefined && { isActive: input.active }) } })
    const action = before.isActive && !r.isActive ? 'DEACTIVATE' : 'UPDATE'
    return { result: { id: r.id, name: r.name, active: r.isActive }, audit: { actorId: actor.id, action, entityType: entity(kind), entityId: id, changes: { before: { name: before.name, isActive: before.isActive }, after: { name: r.name, isActive: r.isActive } }, ...ctx } }
  })
}

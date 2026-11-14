import bcrypt from 'bcrypt'
import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { AppError } from '../utils/errors.js'
import { generateTempPassword } from '../utils/password.js'
import { withAudit, type AuditEntry } from './audit.js'

type Ctx = { ip?: string; userAgent?: string }
type Role = 'ADMIN' | 'MANAGER' | 'AGENT'
type Tz = 'WIB' | 'WITA' | 'WIT'

const select = { id: true, name: true, email: true, role: true, timezone: true, isActive: true, mustChangePassword: true, lastLoginAt: true } as const
type Row = { id: number; name: string; email: string; role: Role; timezone: Tz; isActive: boolean; mustChangePassword: boolean; lastLoginAt: Date | null }

export const toAccount = (u: Row) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, timezone: u.timezone,
  status: !u.isActive ? 'INACTIVE' : u.mustChangePassword ? 'MUST_CHANGE_PASSWORD' : 'ACTIVE',
  lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
})

const snap = (u: Row) => ({ name: u.name, email: u.email, role: u.role, timezone: u.timezone, isActive: u.isActive })

export async function listUsers(actor: AuthUser, f: { query?: string; role?: Role; status?: string }) {
  const q = f.query?.trim()
  const users = await prisma.user.findMany({
    where: {
      ...(actor.role === 'MANAGER' ? { role: 'AGENT' as const } : f.role ? { role: f.role } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
      ...(f.status === 'INACTIVE' ? { isActive: false } : f.status === 'ACTIVE' ? { isActive: true, mustChangePassword: false } : f.status === 'MUST_CHANGE_PASSWORD' ? { isActive: true, mustChangePassword: true } : {}),
    },
    select, orderBy: { id: 'asc' },
  })
  return users.map(toAccount)
}

export async function createUser(actor: AuthUser, input: { name: string; email: string; role: Role; timezone: Tz }, ctx: Ctx) {
  const email = input.email.trim().toLowerCase()
  if (await prisma.user.findUnique({ where: { email } })) throw new AppError('CONFLICT', 'Email sudah terdaftar.')
  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)
  const user = await withAudit(async (tx) => {
    const u = await tx.user.create({ data: { name: input.name.trim(), email, role: input.role, timezone: input.timezone, passwordHash, mustChangePassword: true, createdById: actor.id }, select })
    return { result: u, audit: { actorId: actor.id, action: 'CREATE', entityType: 'user', entityId: u.id, changes: { after: snap(u) }, ...ctx } }
  })
  return { account: toAccount(user), tempPassword }
}

export async function updateUser(actor: AuthUser, id: number, input: { name?: string; email?: string; role?: Role; timezone?: Tz; isActive?: boolean }, ctx: Ctx) {
  const before = await prisma.user.findUnique({ where: { id }, select })
  if (!before) throw new AppError('NOT_FOUND', 'Akun tidak ditemukan.')
  if (actor.role === 'MANAGER') {
    if (before.role !== 'AGENT') throw new AppError('FORBIDDEN', 'Manager hanya boleh mengubah akun agent.')
    if (input.role !== undefined && input.role !== 'AGENT') throw new AppError('FORBIDDEN', 'Manager tidak boleh mengubah peran.')
    if (input.email !== undefined && input.email.trim().toLowerCase() !== before.email) throw new AppError('FORBIDDEN', 'Manager tidak boleh mengubah email.')
  }
  if (id === actor.id && (input.isActive === false || (input.role && input.role !== before.role))) {
    throw new AppError('CONFLICT', 'Anda tidak bisa menonaktifkan akun atau mengubah peran akun Anda sendiri.')
  }
  const email = input.email?.trim().toLowerCase()
  if (email && email !== before.email && (await prisma.user.findUnique({ where: { email } }))) throw new AppError('CONFLICT', 'Email sudah terdaftar.')
  const after = await withAudit(async (tx) => {
    const u = await tx.user.update({ where: { id }, select, data: { ...(input.name !== undefined && { name: input.name.trim() }), ...(email && { email }), ...(input.role && { role: input.role }), ...(input.timezone && { timezone: input.timezone }), ...(input.isActive !== undefined && { isActive: input.isActive }) } })
    const action: AuditEntry['action'] = before.isActive && !u.isActive ? 'DEACTIVATE' : 'UPDATE'
    return { result: u, audit: { actorId: actor.id, action, entityType: 'user', entityId: id, changes: { before: snap(before), after: snap(u) }, ...ctx } }
  })
  return toAccount(after)
}

/** Reset password oleh admin: password sementara baru, ditampilkan sekali. */
export async function resetPassword(actor: AuthUser, id: number, ctx: Ctx) {
  const target = await prisma.user.findUnique({ where: { id }, select })
  if (!target) throw new AppError('NOT_FOUND', 'Akun tidak ditemukan.')
  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)
  await withAudit(async (tx) => {
    await tx.user.update({ where: { id }, data: { passwordHash, mustChangePassword: true } })
    return { result: null, audit: { actorId: actor.id, action: 'PASSWORD_CHANGE', entityType: 'user', entityId: id, ...ctx } }
  })
  return { tempPassword }
}

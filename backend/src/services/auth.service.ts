import bcrypt from 'bcrypt'
import { prisma } from '../db.js'
import { AppError } from '../utils/errors.js'
import { signSession } from '../utils/session-token.js'
import { withAudit } from './audit.js'

// Hash palsu supaya waktu respons sama untuk email yang tidak ada.
const DUMMY_HASH = bcrypt.hashSync('tidak-dipakai', 10)

export async function login(email: string, password: string, ctx: { ip?: string; userAgent?: string }) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !user.isActive || !ok) {
    await withAudit(async (tx) => ({
      result: null,
      audit: { actorId: user?.id ?? null, action: 'LOGIN_FAILED', entityType: 'user', entityId: user?.id ?? null, changes: { email: email.trim().toLowerCase().slice(0, 191) }, ip: ctx.ip, userAgent: ctx.userAgent },
    }))
    throw new AppError('UNAUTHENTICATED', 'Email atau password salah.')
  }
  await withAudit(async () => ({
    result: null,
    audit: { actorId: user.id, action: 'LOGIN', entityType: 'user', entityId: user.id, ip: ctx.ip, userAgent: ctx.userAgent },
  }))
  return { token: signSession(user.id, user.role), user: { id: user.id, name: user.name, email: user.email, role: user.role, timezone: user.timezone, mustChangePassword: user.mustChangePassword } }
}

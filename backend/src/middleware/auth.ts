import type { RequestHandler } from 'express'
import { config } from '../config.js'
import { prisma } from '../db.js'
import { AppError } from '../utils/errors.js'
import { passwordVersion, readCookie, verifySession, type Role } from '../utils/session-token.js'

export interface AuthUser { id: number; name: string; email: string; role: Role; timezone: 'WIB' | 'WITA' | 'WIT'; mustChangePassword: boolean }

declare module 'express-serve-static-core' {
  interface Request { user?: AuthUser }
}

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Perlindungan CSRF: permintaan yang mengubah data harus berasal dari CORS_ORIGIN (header Origin). */
export const originCheck: RequestHandler = (req, _res, next) => {
  if (SAFE.has(req.method)) return next()
  const origin = req.headers.origin
  if (origin !== config.corsOrigin) return next(new AppError('FORBIDDEN', 'Permintaan ditolak (asal tidak dikenali).'))
  next()
}

/** Wajib login: baca cookie, cek token, dan muat akun dari database (akun nonaktif langsung ditolak). */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = readCookie(req.headers.cookie, config.cookieName)
    const session = token ? verifySession(token) : null
    if (!session) throw new AppError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.')
    const u = await prisma.user.findUnique({ where: { id: session.sub } })
    if (!u || !u.isActive || passwordVersion(u.passwordHash) !== session.pv) throw new AppError('UNAUTHENTICATED', 'Akun tidak aktif atau tidak ditemukan.')
    req.user = { id: u.id, name: u.name, email: u.email, role: u.role, timezone: u.timezone, mustChangePassword: u.mustChangePassword }
    next()
  } catch (e) {
    next(e)
  }
}

/** Batasi endpoint ke peran tertentu. Pakai setelah `authenticate`. */
export const requireRole = (...roles: Role[]): RequestHandler => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AppError('FORBIDDEN', 'Anda tidak punya akses ke fitur ini.'))
  next()
}

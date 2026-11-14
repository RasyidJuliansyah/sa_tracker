import { createHash } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT'
export interface SessionPayload { sub: number; role: Role; pv: string }

/** Sidik password saat ini: berubah setiap password diganti/direset, sehingga sesi lama otomatis tidak berlaku. */
export const passwordVersion = (passwordHash: string): string => createHash('sha256').update(passwordHash).digest('hex').slice(0, 16)

export function signSession(userId: number, role: Role, passwordHash: string): string {
  return jwt.sign({ role, pv: passwordVersion(passwordHash) }, config.jwtSecret, { subject: String(userId), expiresIn: `${config.sessionHours}h`, algorithm: 'HS256' })
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const p = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload
    const sub = Number(p.sub)
    if (!Number.isInteger(sub) || !['ADMIN', 'MANAGER', 'AGENT'].includes(p.role)) return null
    if (typeof p.pv !== 'string') return null
    return { sub, role: p.role as Role, pv: p.pv }
  } catch {
    return null
  }
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim())
  }
  return null
}

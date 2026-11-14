import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT'
export interface SessionPayload { sub: number; role: Role }

export function signSession(userId: number, role: Role): string {
  return jwt.sign({ role }, config.jwtSecret, { subject: String(userId), expiresIn: `${config.sessionHours}h`, algorithm: 'HS256' })
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const p = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload
    const sub = Number(p.sub)
    if (!Number.isInteger(sub) || !['ADMIN', 'MANAGER', 'AGENT'].includes(p.role)) return null
    return { sub, role: p.role as Role }
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

import type { Prisma, PrismaClient } from '../generated/prisma/client.js'
import { prisma } from '../db.js'

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'ASSIGN' | 'UNASSIGN' | 'CHECK_IN' | 'CHECK_OUT'
  | 'LOGIN' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'IMPORT' | 'EXPORT'

export type Tx = Prisma.TransactionClient

export interface AuditEntry {
  actorId: number | null
  action: AuditAction
  entityType: string
  entityId?: number | null
  /** { before, after } atau ringkasan lain. Kolom rahasia dibuang otomatis. */
  changes?: unknown
  ip?: string | null
  userAgent?: string | null
}

const SECRET_KEYS = new Set(['password', 'passwordHash', 'password_hash', 'token', 'photoPath', 'photo_path'])

/** Buang kolom rahasia (rekursif) sebelum disimpan ke audit log. */
export function sanitizeChanges(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sanitizeChanges)
  if (v instanceof Date) return v.toISOString()
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).filter(([k]) => !SECRET_KEYS.has(k)).map(([k, x]) => [k, sanitizeChanges(x)]),
    )
  }
  return v
}

/** Satu-satunya jalan menulis audit_logs. Wajib dipanggil di dalam transaksi yang mengubah datanya. */
export async function writeAudit(tx: Tx, e: AuditEntry): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId: e.actorId,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId ?? null,
      changes: e.changes === undefined ? undefined : (sanitizeChanges(e.changes) as Prisma.InputJsonValue),
      ipAddress: e.ip?.slice(0, 45) ?? null,
      userAgent: e.userAgent?.slice(0, 255) ?? null,
    },
  })
}

/** Jalankan perubahan data + tulis audit dalam satu transaksi; gagal salah satu = batal semua. */
export async function withAudit<T>(
  work: (tx: Tx) => Promise<{ result: T; audit: AuditEntry | AuditEntry[] }>,
  client: PrismaClient = prisma,
): Promise<T> {
  return client.$transaction(async (tx) => {
    const { result, audit } = await work(tx)
    for (const a of Array.isArray(audit) ? audit : [audit]) await writeAudit(tx, a)
    return result
  })
}

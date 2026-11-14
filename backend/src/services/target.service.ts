import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { AppError } from '../utils/errors.js'
import { dateKeyIn } from '../utils/timezone.js'
import { withAudit } from './audit.js'
import { DEFAULT_TARGET_PERCENT, retentionForYear, type ContractRow } from './retention.js'

type Ctx = { ip?: string; userAgent?: string }
const dk = (d: Date) => d.toISOString().slice(0, 10)

export async function loadContractRows(): Promise<ContractRow[]> {
  const rows = await prisma.schoolContract.findMany()
  return rows.map((c) => ({ id: c.id, schoolId: c.schoolId, endDate: dk(c.contractEndDate), value: Number(c.contractValue), previousContractId: c.previousContractId, type: c.contractType, signedDate: c.signedDate ? dk(c.signedDate) : null }))
}

/** Target per tahun + capaian kohort. Tahun: yang punya target, yang punya kohort, tahun ini, dan tahun depan. */
export async function listTargets() {
  const today = dateKeyIn(new Date())
  const thisYear = Number(today.slice(0, 4))
  const [targets, contracts] = await Promise.all([prisma.retentionTarget.findMany(), loadContractRows()])
  const years = new Set<number>([thisYear, thisYear + 1, ...targets.map((t) => t.year), ...contracts.map((c) => Number(c.endDate.slice(0, 4)))])
  return [...years].sort((a, b) => b - a).map((year) => {
    const row = targets.find((t) => t.year === year)
    const targetPercent = row ? Number(row.targetPercent) : DEFAULT_TARGET_PERCENT
    const r = retentionForYear(contracts, year, today, targetPercent)
    return {
      year, targetPercent, isDefault: !row, cohortValue: r.cohortValue, signedValue: r.retainedValue, retention: r.percent ?? 0,
      status: r.status === 'NO_DATA' ? 'NONE' : r.status === 'MET' ? 'ON_TARGET' : 'BELOW',
    }
  })
}

export async function saveTarget(actor: AuthUser, year: number, percent: number, ctx: Ctx) {
  if (!(percent > 0 && percent <= 100)) throw new AppError('VALIDATION', 'Persentase target harus lebih dari 0 dan paling banyak 100.')
  const before = await prisma.retentionTarget.findUnique({ where: { year } })
  await withAudit(async (tx) => {
    const r = await tx.retentionTarget.upsert({ where: { year }, create: { year, targetPercent: percent, setById: actor.id }, update: { targetPercent: percent, setById: actor.id } })
    return { result: null, audit: { actorId: actor.id, action: before ? 'UPDATE' : 'CREATE', entityType: 'retention_target', entityId: r.id, changes: { before: before ? { year, targetPercent: Number(before.targetPercent) } : { year, targetPercent: DEFAULT_TARGET_PERCENT, default: true }, after: { year, targetPercent: percent } }, ...ctx } }
  })
  return listTargets()
}

import { prisma } from '../db.js'
import type { AuthUser } from '../middleware/auth.js'
import { AppError } from '../utils/errors.js'
import { dateKeyIn } from '../utils/timezone.js'
import { withAudit, type Tx } from './audit.js'
import { currentContract, renewalStatus, validateContractPeriod, validateRenewal } from './contract-rules.js'

type Ctx = { ip?: string; userAgent?: string }
const dk = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null)
const toDate = (k: string | null | undefined) => (k ? new Date(`${k}T00:00:00Z`) : null)

const include = {
  jenjang: true, package: true,
  contracts: true,
  assignments: { where: { unassignedAt: null }, include: { agent: { select: { id: true, name: true } } } },
} as const

type SchoolFull = NonNullable<Awaited<ReturnType<typeof loadOne>>>
const loadOne = (id: number) => prisma.school.findUnique({ where: { id }, include })

const contractDto = (c: SchoolFull['contracts'][number]) => ({
  id: c.id, type: c.contractType, previousContractId: c.previousContractId, signedDate: dk(c.signedDate),
  start: dk(c.contractStartDate)!, end: dk(c.contractEndDate)!, value: Number(c.contractValue), note: c.note,
})

function summary(s: SchoolFull, today: string) {
  const lite = s.contracts.map((c) => ({ id: c.id, startDate: dk(c.contractStartDate)!, endDate: dk(c.contractEndDate)!, previousContractId: c.previousContractId, raw: c }))
  const cur = currentContract(lite, today)
  const a = s.assignments[0]
  return {
    id: s.id, npsn: s.npsn, name: s.name, lmsSchoolId: s.lmsSchoolId, city: s.city, timezone: s.timezone,
    jenjang: { id: s.jenjang.id, name: s.jenjang.name }, package: { id: s.package.id, name: s.package.name },
    agent: a ? { id: a.agent.id, name: a.agent.name, sharePercent: Number(a.sharePercent), assignmentId: a.id, assignedAt: dk(a.assignedAt)! } : null,
    contract: cur ? contractDto(cur.raw) : null,
    status: renewalStatus(lite, today),
  }
}

/** AGENT hanya boleh melihat sekolah yang sedang ditugaskan kepadanya. */
function assertVisible(actor: AuthUser, s: SchoolFull) {
  if (actor.role === 'AGENT' && !s.assignments.some((a) => a.agentId === actor.id)) throw new AppError('NOT_FOUND', 'Sekolah tidak ditemukan.')
}

export async function listSchools(actor: AuthUser, f: { query?: string; jenjangId?: number; packageId?: number; status?: string; agentId?: string; page: number; pageSize: number }) {
  const q = f.query?.trim()
  const rows = await prisma.school.findMany({
    where: {
      ...(q ? { OR: [{ name: { contains: q } }, { npsn: { contains: q } }] } : {}),
      ...(f.jenjangId ? { jenjangId: f.jenjangId } : {}), ...(f.packageId ? { packageId: f.packageId } : {}),
      ...(actor.role === 'AGENT' ? { assignments: { some: { agentId: actor.id, unassignedAt: null } } } : {}),
    },
    include, orderBy: { name: 'asc' },
  })
  const today = dateKeyIn(new Date())
  const all = rows.map((r) => summary(r, today)).filter((r) =>
    (!f.status || r.status?.kind === f.status) &&
    (!f.agentId || (f.agentId === 'NONE' ? !r.agent : String(r.agent?.id) === f.agentId)))
  return { total: all.length, items: all.slice((f.page - 1) * f.pageSize, f.page * f.pageSize) }
}

export async function getSchool(actor: AuthUser, id: number) {
  const s = await loadOne(id)
  if (!s) throw new AppError('NOT_FOUND', 'Sekolah tidak ditemukan.')
  assertVisible(actor, s)
  const history = await prisma.schoolAssignment.findMany({ where: { schoolId: id }, include: { agent: { select: { name: true } } }, orderBy: { id: 'desc' } })
  return {
    school: {
      ...summary(s, dateKeyIn(new Date())),
      address: s.address, picName: s.picName, picContact: s.picContact,
      partnershipStartDate: dk(s.partnershipStartDate), onboardingDate: dk(s.onboardingDate), activeSinceDate: dk(s.activeSinceDate), partnershipEndDate: dk(s.partnershipEndDate),
    },
    contracts: s.contracts.map(contractDto).sort((a, b) => b.end.localeCompare(a.end)),
    assignments: history.map((h) => ({ id: h.id, agentId: h.agentId, agent: h.agent.name, sharePercent: Number(h.sharePercent), assignedAt: h.assignedAt.toISOString(), unassignedAt: h.unassignedAt?.toISOString() ?? null })),
  }
}

/** Riwayat perubahan sekolah: baris audit sekolah itu dan kontraknya (changes.schoolId). Hanya admin/manager. */
export async function schoolChanges(id: number) {
  const rows = await prisma.auditLog.findMany({
    where: { OR: [{ entityType: 'school', entityId: id }, { entityType: 'contract', changes: { path: '$.schoolId', equals: id } }] },
    orderBy: { id: 'desc' }, take: 200, include: { actor: { select: { name: true, role: true } } },
  })
  return rows.map((r) => ({ id: r.id, at: r.createdAt.toISOString(), action: r.action, entityType: r.entityType, actor: r.actor?.name ?? null, actorRole: r.actor?.role ?? null, changes: r.changes }))
}

async function assertRefs(tx: Tx | typeof prisma, jenjangId?: number, packageId?: number) {
  if (jenjangId && !(await tx.jenjang.findUnique({ where: { id: jenjangId } }))?.isActive) throw new AppError('VALIDATION', 'Jenjang tidak valid atau nonaktif.')
  if (packageId && !(await tx.package.findUnique({ where: { id: packageId } }))?.isActive) throw new AppError('VALIDATION', 'Paket tidak valid atau nonaktif.')
}

type SchoolData = { name: string; npsn: string; lmsSchoolId: number | null; jenjangId: number; packageId: number; timezone: 'WIB' | 'WITA' | 'WIT'; city: string | null; address: string | null; picName: string | null; picContact: string | null; partnershipStartDate: string; onboardingDate: string | null; activeSinceDate: string | null; partnershipEndDate: string | null }
const prismaData = (d: Partial<SchoolData>) => ({
  ...d,
  ...(d.partnershipStartDate !== undefined && { partnershipStartDate: toDate(d.partnershipStartDate)! }),
  ...(d.onboardingDate !== undefined && { onboardingDate: toDate(d.onboardingDate) }),
  ...(d.activeSinceDate !== undefined && { activeSinceDate: toDate(d.activeSinceDate) }),
  ...(d.partnershipEndDate !== undefined && { partnershipEndDate: toDate(d.partnershipEndDate) }),
})

export async function createSchool(actor: AuthUser, input: SchoolData & { contract: { signedDate?: string | null; start: string; end: string; value: number; note: string | null }; agentId?: number | null }, ctx: Ctx) {
  await assertRefs(prisma, input.jenjangId, input.packageId)
  if (await prisma.school.findUnique({ where: { npsn: input.npsn } })) throw new AppError('CONFLICT', 'NPSN sudah dipakai sekolah lain.')
  if (input.lmsSchoolId && (await prisma.school.findUnique({ where: { lmsSchoolId: input.lmsSchoolId } }))) throw new AppError('CONFLICT', 'ID LMS sudah dipakai sekolah lain.')
  validateContractPeriod({ startDate: input.contract.start, endDate: input.contract.end }, [])
  if (input.agentId) {
    const ag = await prisma.user.findUnique({ where: { id: input.agentId } })
    if (!ag || ag.role !== 'AGENT' || !ag.isActive) throw new AppError('VALIDATION', 'Agent tidak valid.')
  }
  const { contract, agentId, ...data } = input
  const id = await withAudit(async (tx) => {
    const s = await tx.school.create({ data: prismaData(data) as never })
    const c = await tx.schoolContract.create({ data: { schoolId: s.id, contractType: 'NEW', signedDate: toDate(contract.signedDate), contractStartDate: toDate(contract.start)!, contractEndDate: toDate(contract.end)!, contractValue: contract.value, note: contract.note, createdById: actor.id } })
    const audit = [
      { actorId: actor.id, action: 'CREATE' as const, entityType: 'school', entityId: s.id, changes: { after: data }, ...ctx },
      { actorId: actor.id, action: 'CREATE' as const, entityType: 'contract', entityId: c.id, changes: { schoolId: s.id, after: contract }, ...ctx },
    ]
    if (agentId) {
      const a = await tx.schoolAssignment.create({ data: { schoolId: s.id, agentId, assignedById: actor.id, sharePercent: 100 } })
      audit.push({ actorId: actor.id, action: 'ASSIGN' as never, entityType: 'assignment', entityId: a.id, changes: { schoolId: s.id, after: { agentId } } as never, ...ctx })
    }
    return { result: s.id, audit }
  })
  return getSchool(actor, id)
}

export async function updateSchool(actor: AuthUser, id: number, input: Partial<SchoolData>, ctx: Ctx) {
  const before = await loadOne(id)
  if (!before) throw new AppError('NOT_FOUND', 'Sekolah tidak ditemukan.')
  await assertRefs(prisma, input.jenjangId, input.packageId)
  if (input.npsn && input.npsn !== before.npsn && (await prisma.school.findUnique({ where: { npsn: input.npsn } }))) throw new AppError('CONFLICT', 'NPSN sudah dipakai sekolah lain.')
  if (input.lmsSchoolId && input.lmsSchoolId !== before.lmsSchoolId && (await prisma.school.findUnique({ where: { lmsSchoolId: input.lmsSchoolId } }))) throw new AppError('CONFLICT', 'ID LMS sudah dipakai sekolah lain.')
  const keys = Object.keys(input) as (keyof SchoolData)[]
  const pick = (s: Record<string, unknown>) => Object.fromEntries(keys.map((k) => [k, s[k] instanceof Date ? dk(s[k] as Date) : s[k] ?? null]))
  await withAudit(async (tx) => {
    const after = await tx.school.update({ where: { id }, data: prismaData(input) as never })
    return { result: null, audit: { actorId: actor.id, action: 'UPDATE', entityType: 'school', entityId: id, changes: { before: pick(before as never), after: pick(after as never) }, ...ctx } }
  })
  return getSchool(actor, id)
}

export async function addRenewal(actor: AuthUser, schoolId: number, input: { previousContractId: number; signedDate: string; start: string; end: string; value: number; note: string | null }, ctx: Ctx) {
  const s = await loadOne(schoolId)
  if (!s) throw new AppError('NOT_FOUND', 'Sekolah tidak ditemukan.')
  const base = s.contracts.find((c) => c.id === input.previousContractId)
  if (!base) throw new AppError('VALIDATION', 'Kontrak yang diperpanjang tidak ditemukan di sekolah ini.')
  validateRenewal({ signedDate: input.signedDate, previousHasRenewal: s.contracts.some((c) => c.previousContractId === base.id) })
  validateContractPeriod({ startDate: input.start, endDate: input.end }, s.contracts.map((c) => ({ id: c.id, startDate: dk(c.contractStartDate)!, endDate: dk(c.contractEndDate)! })))
  await withAudit(async (tx) => {
    const c = await tx.schoolContract.create({ data: { schoolId, contractType: 'RENEWAL', previousContractId: base.id, signedDate: toDate(input.signedDate), contractStartDate: toDate(input.start)!, contractEndDate: toDate(input.end)!, contractValue: input.value, note: input.note, createdById: actor.id } })
    return { result: null, audit: { actorId: actor.id, action: 'CREATE', entityType: 'contract', entityId: c.id, changes: { schoolId, after: { type: 'RENEWAL', ...input } }, ...ctx } }
  })
  return getSchool(actor, schoolId)
}

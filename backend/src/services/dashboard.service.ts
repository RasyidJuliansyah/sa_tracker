import { prisma } from '../db.js'
import { periodFor, type PeriodKind } from '../utils/period.js'
import { dateKeyIn } from '../utils/timezone.js'
import { renewalStatus, daysBetween, currentContract } from './contract-rules.js'
import { seriesFor, totalsFor, type RenewalLite, type VisitLite } from './dashboard-calc.js'
import { cohortBreakdown, DEFAULT_TARGET_PERCENT, retentionForAgent, retentionForYear, type Assignment, type ContractRow } from './retention.js'

const dk = (d: Date) => d.toISOString().slice(0, 10)

/** Muat data mentah yang dibutuhkan dashboard. Satu kali per permintaan. */
async function loadBase(kind: PeriodKind, offset: number) {
  const today = dateKeyIn(new Date())
  const period = periodFor(kind, today, offset)
  const previous = periodFor(kind, today, offset - 1)
  const year = Number(today.slice(0, 4))
  const [schools, agents, contractsRaw, visitsRaw, target] = await Promise.all([
    prisma.school.findMany({ select: { id: true, name: true, contracts: true, assignments: { where: { unassignedAt: null }, select: { agentId: true, sharePercent: true } } } }),
    prisma.user.findMany({ where: { role: 'AGENT', isActive: true }, select: { id: true, name: true, timezone: true }, orderBy: { name: 'asc' } }),
    prisma.schoolContract.findMany(),
    prisma.visit.findMany({ where: { checkInAt: { gte: previous.fromUtc, lt: period.toUtc } }, select: { agentId: true, schoolId: true, checkInAt: true, checkOutAt: true } }),
    prisma.retentionTarget.findUnique({ where: { year } }),
  ])
  const assignments: Assignment[] = schools.flatMap((s) => s.assignments.map((a) => ({ schoolId: s.id, agentId: a.agentId, sharePercent: Number(a.sharePercent) })))
  const contracts: ContractRow[] = contractsRaw.map((c) => ({ id: c.id, schoolId: c.schoolId, endDate: dk(c.contractEndDate), value: Number(c.contractValue), previousContractId: c.previousContractId, type: c.contractType, signedDate: c.signedDate ? dk(c.signedDate) : null }))
  const visits: VisitLite[] = visitsRaw.map((v) => ({ ...v, assigned: assignments.some((a) => a.schoolId === v.schoolId && a.agentId === v.agentId) }))
  const renewals: RenewalLite[] = contracts.filter((c) => c.type === 'RENEWAL' && c.signedDate).map((c) => ({ value: c.value, signedDate: c.signedDate! }))
  return { today, period, previous, year, schools, agents, contracts, assignments, visits, renewals, targetPercent: target ? Number(target.targetPercent) : DEFAULT_TARGET_PERCENT }
}

type Base = Awaited<ReturnType<typeof loadBase>>

const lastVisitBySchool = async (ids: number[]) => {
  if (!ids.length) return new Map<number, Date>()
  const rows = await prisma.visit.groupBy({ by: ['schoolId'], where: { schoolId: { in: ids } }, _max: { checkInAt: true } })
  return new Map(rows.map((r) => [r.schoolId, r._max.checkInAt!]))
}

/** Sekolah bertugas yang tidak dikunjungi siapa pun pada periode terpilih + kontrak perlu perhatian (lewat tempo / ≤ 60 hari). */
async function schoolLists(b: Base) {
  const inPeriod = new Set(b.visits.filter((v) => v.checkInAt >= b.period.fromUtc && v.checkInAt < b.period.toUtc).map((v) => v.schoolId))
  const agentName = new Map(b.agents.map((a) => [a.id, a.name]))
  const assigned = b.schools.filter((s) => s.assignments[0])
  const unvisitedSchools = assigned.filter((s) => !inPeriod.has(s.id))
  const last = await lastVisitBySchool(unvisitedSchools.map((s) => s.id))
  const unvisited = unvisitedSchools.map((s) => ({ schoolId: s.id, name: s.name, agentId: s.assignments[0]!.agentId, agent: agentName.get(s.assignments[0]!.agentId) ?? '', lastVisitAt: last.get(s.id)?.toISOString() ?? null }))
  const attention = b.schools.flatMap((s) => {
    const lite = s.contracts.map((c) => ({ id: c.id, startDate: dk(c.contractStartDate), endDate: dk(c.contractEndDate), previousContractId: c.previousContractId }))
    const st = renewalStatus(lite, b.today)
    const cur = currentContract(lite, b.today)
    if (!st || !cur || (st.kind !== 'EXPIRED' && st.kind !== 'ENDING_SOON')) return []
    const raw = s.contracts.find((c) => c.id === cur.id)!
    const a = s.assignments[0]
    return [{ schoolId: s.id, school: s.name, agentId: a?.agentId ?? null, agent: a ? (agentName.get(a.agentId) ?? '') : null, endDate: cur.endDate, value: Number(raw.contractValue), kind: st.kind === 'EXPIRED' ? 'lapsed' : 'soon', days: Math.abs(daysBetween(b.today, cur.endDate)) }]
  }).sort((x, y) => (x.kind === y.kind ? y.days - x.days : x.kind === 'lapsed' ? -1 : 1))
  return { unvisited, attention }
}

export async function managerDashboard(kind: PeriodKind, offset: number) {
  const b = await loadBase(kind, offset)
  const annual = retentionForYear(b.contracts, b.year, b.today, b.targetPercent)
  const perAgent = b.agents.map((a) => {
    const r = retentionForAgent(b.contracts, b.assignments, a.id, b.year, b.today, b.targetPercent)
    return { id: a.id, name: a.name, timezone: a.timezone, schools: b.assignments.filter((x) => x.agentId === a.id).length, retentionPct: r.percent ?? 0, status: r.status, retainedValue: r.retainedValue, cohortValue: r.cohortValue, visits: totalsFor(b.visits.filter((v) => v.agentId === a.id), [], b.period).visits }
  })
  const totalRetained = perAgent.reduce((s, a) => s + a.retainedValue, 0)
  const lists = await schoolLists(b)
  const unvisitedCount = new Map<number, number>()
  lists.unvisited.forEach((u) => unvisitedCount.set(u.agentId, (unvisitedCount.get(u.agentId) ?? 0) + 1))
  const now = seriesFor(kind, b.visits, b.renewals, b.period)
  const before = seriesFor(kind, b.visits, b.renewals, b.previous, now.visits.length)
  return {
    today: b.today, period: { start: b.period.start, end: b.period.end }, previous: { start: b.previous.start, end: b.previous.end },
    annual: { year: b.year, targetPercent: b.targetPercent, ...annual, breakdown: cohortBreakdown(b.contracts, b.year, b.today) },
    agents: perAgent.map((a) => ({ ...a, contributionPct: totalRetained ? (a.retainedValue / totalRetained) * 100 : 0, unvisited: unvisitedCount.get(a.id) ?? 0 })),
    stats: { current: totalsFor(b.visits, b.renewals, b.period), previous: totalsFor(b.visits, b.renewals, b.previous) },
    chart: { labels: now.labels, now, before },
    attention: lists.attention, unvisited: lists.unvisited,
  }
}

export async function agentDashboard(agentId: number, kind: PeriodKind, offset: number) {
  const b = await loadBase(kind, offset)
  const mine = new Set(b.assignments.filter((a) => a.agentId === agentId).map((a) => a.schoolId))
  const mineVisits = b.visits.filter((v) => v.agentId === agentId)
  const mineRenewals = b.contracts.filter((c) => c.type === 'RENEWAL' && c.signedDate && mine.has(c.schoolId)).map((c) => ({ value: c.value, signedDate: c.signedDate! }))
  const r = retentionForAgent(b.contracts, b.assignments, agentId, b.year, b.today, b.targetPercent)
  const lists = await schoolLists(b)
  return {
    today: b.today, period: { start: b.period.start, end: b.period.end }, previous: { start: b.previous.start, end: b.previous.end },
    retention: { year: b.year, targetPercent: b.targetPercent, ...r },
    stats: { current: totalsFor(mineVisits, mineRenewals, b.period), previous: totalsFor(mineVisits, mineRenewals, b.previous) },
    unvisited: lists.unvisited.filter((u) => u.agentId === agentId),
    attention: lists.attention.filter((a) => a.agentId === agentId),
  }
}

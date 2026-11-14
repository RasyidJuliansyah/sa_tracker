import 'dotenv/config'
import bcrypt from 'bcrypt'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/sa_visit_tracker(\?|$)/, '/sa_visit_tracker_test$1')
const ok = !!base && base.includes('sa_visit_tracker_test')
if (ok) { process.env.DATABASE_URL = base; process.env.LOGIN_RATE_LIMIT = '1000' }
const PW = 'Rahasia-Uji-123'

describe.skipIf(!ok)('penugasan dan target retention (database uji)', () => {
  let server: Server, url: string
  let prisma: (typeof import('../../src/db.js'))['prisma']
  const stamp = Date.now()
  const em = (r: string) => `${r}${stamp}@b6.test`
  const cookies: Record<string, string> = {}
  const ids: Record<string, number> = {}
  let jenjangId = 0, packageId = 0
  const npsn = (n: number) => String(10000000 + (stamp % 80000000) + n + 5000)

  const call = (who: string | null, path: string, method = 'GET', body?: unknown) =>
    fetch(url + path, { method, headers: { 'content-type': 'application/json', origin: 'http://localhost:3010', ...(who ? { cookie: cookies[who]! } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const school = (n: number, extra: object = {}) => ({
    name: `Sekolah Uji ${n}`, npsn: npsn(n), jenjangId, packageId, timezone: 'WIB', city: 'Bogor', partnershipStartDate: '2025-01-01',
    contract: { signedDate: '2025-01-01', start: '2025-12-01', end: '2026-11-30', value: 80_000_000, note: null }, ...extra,
  })

  beforeAll(async () => {
    ;({ prisma } = await import('../../src/db.js'))
    server = (await import('../../src/app.js')).createApp().listen(0)
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const passwordHash = await bcrypt.hash(PW, 4)
    for (const [r, role] of [['admin', 'ADMIN'], ['manager', 'MANAGER'], ['agent', 'AGENT'], ['agent2', 'AGENT']] as const) {
      const u = await prisma.user.create({ data: { name: `U ${r}`, email: em(r), passwordHash, role } })
      ids[r] = u.id
      const res = await fetch(url + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3010' }, body: JSON.stringify({ email: em(r), password: PW }) })
      cookies[r] = res.headers.get('set-cookie')!.split(';')[0]!
    }
    jenjangId = (await prisma.jenjang.create({ data: { name: `JB6${stamp}`.slice(0, 28) } })).id
    packageId = (await prisma.package.create({ data: { name: `PB6${stamp}` } })).id
  })
  afterAll(async () => { server?.close(); await prisma?.$disconnect() })

  it('tugaskan lalu pindah: baris lama ditutup, baru dibuat, audit ASSIGN/UNASSIGN; agent tidak boleh', async () => {
    const created = await (await call('manager', '/api/schools', 'POST', school(1))).json()
    const sid = created.school.id
    expect((await call('agent', `/api/schools/${sid}/assignment`, 'PUT', { agentId: ids.agent })).status).toBe(403)
    expect((await call('manager', `/api/schools/${sid}/assignment`, 'PUT', { agentId: ids.agent })).status).toBe(200)
    expect((await call('manager', `/api/schools/${sid}/assignment`, 'PUT', { agentId: ids.agent })).status).toBe(200) // sama: tidak berubah
    expect((await call('manager', `/api/schools/${sid}/assignment`, 'PUT', { agentId: ids.agent2 })).status).toBe(200)
    const rows = await prisma.schoolAssignment.findMany({ where: { schoolId: sid }, orderBy: { id: 'asc' } })
    expect(rows).toHaveLength(2)
    expect(rows[0]!.unassignedAt).not.toBeNull()
    expect(rows.filter((r) => !r.unassignedAt)).toHaveLength(1)
    expect(await prisma.auditLog.count({ where: { entityType: 'assignment', action: 'UNASSIGN', entityId: rows[0]!.id } })).toBe(1)
    const d = await (await call('manager', `/api/schools/${sid}`)).json()
    expect(d.school.agent.id).toBe(ids.agent2)
    expect(d.assignments).toHaveLength(2)
    expect((await call('manager', `/api/schools/${sid}/assignment`, 'PUT', { agentId: ids.manager ?? ids.admin })).status).toBe(400) // bukan agent
  })
  it('daftar penugasan: per agent dan tanpa agent', async () => {
    const r = await (await call('manager', '/api/assignments')).json()
    expect(r.agents.some((a: { id: number; schools: unknown[] }) => a.id === ids.agent2 && a.schools.length >= 1)).toBe(true)
    expect(Array.isArray(r.unassigned)).toBe(true)
    expect(typeof r.agents[0].retention).toBe('number')
  })
  it('target retention: default 65 lalu disimpan; contoh sekolah A dan B (kohort 2090) = 90%, tercapai', async () => {
    const mk = async (n: number, value: number, renewValue: number) => {
      const c = await (await call('admin', '/api/schools', 'POST', school(10 + n, { contract: { signedDate: '2089-01-01', start: '2089-07-01', end: '2090-06-30', value, note: null } }))).json()
      const r = await call('admin', `/api/schools/${c.school.id}/contracts`, 'POST', { previousContractId: c.contracts[0].id, signedDate: '2090-02-01', start: '2090-07-01', end: '2091-06-30', value: renewValue, note: null })
      expect(r.status).toBe(201)
    }
    await mk(1, 80_000_000, 80_000_000)
    await mk(2, 20_000_000, 10_000_000)
    const before = (await (await call('manager', '/api/retention-targets')).json()).items.find((t: { year: number }) => t.year === 2090)
    expect(before).toMatchObject({ targetPercent: 65, isDefault: true, cohortValue: 100_000_000, signedValue: 90_000_000, retention: 90, status: 'ON_TARGET' })
    const saved = await call('manager', '/api/retention-targets/2090', 'PUT', { targetPercent: 95 })
    expect(saved.status).toBe(200)
    const after = (await saved.json()).items.find((t: { year: number }) => t.year === 2090)
    expect(after).toMatchObject({ targetPercent: 95, isDefault: false, status: 'BELOW' })
    expect(await prisma.auditLog.count({ where: { entityType: 'retention_target', action: 'CREATE' } })).toBeGreaterThanOrEqual(1)
    expect((await call('manager', '/api/retention-targets/2090', 'PUT', { targetPercent: 101 })).status).toBe(400)
    expect((await call('agent', '/api/retention-targets')).status).toBe(403)
  })
})

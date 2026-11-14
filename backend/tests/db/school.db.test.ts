import 'dotenv/config'
import bcrypt from 'bcrypt'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/sa_visit_tracker(\?|$)/, '/sa_visit_tracker_test$1')
const ok = !!base && base.includes('sa_visit_tracker_test')
if (ok) { process.env.DATABASE_URL = base; process.env.LOGIN_RATE_LIMIT = '1000' }
const PW = 'Rahasia-Uji-123'

describe.skipIf(!ok)('sekolah dan kontrak (database uji)', () => {
  let server: Server, url: string
  let prisma: (typeof import('../../src/db.js'))['prisma']
  const stamp = Date.now()
  const em = (r: string) => `${r}${stamp}@b5.test`
  const cookies: Record<string, string> = {}
  const ids: Record<string, number> = {}
  let jenjangId = 0, packageId = 0
  const npsn = (n: number) => String(10000000 + (stamp % 80000000) + n)

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
    jenjangId = (await prisma.jenjang.create({ data: { name: `JB5${stamp}`.slice(0, 28) } })).id
    packageId = (await prisma.package.create({ data: { name: `PB5${stamp}` } })).id
  })
  afterAll(async () => { server?.close(); await prisma?.$disconnect() })

  it('manager menambah sekolah + kontrak pertama + agent; NPSN dan ID LMS unik; audit tercatat', async () => {
    const r = await call('manager', '/api/schools', 'POST', school(1, { agentId: ids.agent, lmsSchoolId: 900000 + (stamp % 90000) }))
    expect(r.status).toBe(201)
    const b = await r.json()
    expect(b.school.agent.id).toBe(ids.agent)
    expect(b.contracts).toHaveLength(1)
    expect(b.contracts[0].type).toBe('NEW')
    expect(await prisma.auditLog.count({ where: { entityType: 'school', entityId: b.school.id, action: 'CREATE' } })).toBe(1)
    expect((await call('manager', '/api/schools', 'POST', school(1))).status).toBe(409)
    expect((await call('manager', '/api/schools', 'POST', school(2, { lmsSchoolId: b.school.lmsSchoolId }))).status).toBe(409)
    expect((await call('manager', '/api/schools', 'POST', school(3, { npsn: '123' }))).status).toBe(400)
    expect((await call('manager', '/api/schools', 'POST', school(4, { contract: { start: '2026-05-01', end: '2026-05-01', value: 1, signedDate: null, note: null } }))).status).toBe(400)
  })
  it('agent tidak boleh menambah/mengubah; hanya melihat sekolah yang ditugaskan', async () => {
    expect((await call('agent', '/api/schools', 'POST', school(5))).status).toBe(403)
    const list = await (await call('agent', '/api/schools')).json()
    expect(list.items.length).toBeGreaterThan(0)
    expect(list.items.every((s: { agent: { id: number } }) => s.agent.id === ids.agent)).toBe(true)
    const own = list.items[0].id
    expect((await call('agent', `/api/schools/${own}`)).status).toBe(200)
    expect((await call('agent2', `/api/schools/${own}`)).status).toBe(404)
    expect((await call('agent', `/api/schools/${own}`, 'PATCH', { name: 'X' })).status).toBe(403)
    expect((await call('agent', `/api/schools/${own}/changes`)).status).toBe(403)
  })
  it('perpanjangan: validasi dan satu per kontrak; retention dihitung dari data; tampil di riwayat', async () => {
    const created = await (await call('admin', '/api/schools', 'POST', school(6))).json()
    const sid = created.school.id, base = created.contracts[0]
    const renewal = { previousContractId: base.id, signedDate: '2026-10-01', start: '2026-12-01', end: '2027-11-30', value: 40_000_000, note: 'turun' }
    expect((await call('manager', `/api/schools/${sid}/contracts`, 'POST', { ...renewal, signedDate: undefined })).status).toBe(400)
    expect((await call('manager', `/api/schools/${sid}/contracts`, 'POST', { ...renewal, start: '2026-06-01' })).status).toBe(409) // tumpang tindih
    const ok = await call('manager', `/api/schools/${sid}/contracts`, 'POST', renewal)
    expect(ok.status).toBe(201)
    const b = await ok.json()
    expect(b.contracts).toHaveLength(2)
    expect(b.school.status.kind).toBe('RENEWED')
    expect((await call('manager', `/api/schools/${sid}/contracts`, 'POST', renewal)).status).toBe(409)
    const ch = (await (await call('manager', `/api/schools/${sid}/changes`)).json()).items
    expect(ch.length).toBeGreaterThanOrEqual(3) // sekolah, kontrak pertama, perpanjangan
  })
  it('ubah sekolah mencatat sebelum/sesudah; daftar memfilter status dan pencarian', async () => {
    const created = await (await call('admin', '/api/schools', 'POST', school(7))).json()
    const sid = created.school.id
    const r = await call('manager', `/api/schools/${sid}`, 'PATCH', { city: 'Depok' })
    expect((await r.json()).school.city).toBe('Depok')
    const log = await prisma.auditLog.findFirst({ where: { entityType: 'school', entityId: sid, action: 'UPDATE' } })
    expect(JSON.stringify(log!.changes)).toContain('Depok')
    const q = await (await call('manager', `/api/schools?query=${encodeURIComponent('Sekolah Uji 7')}&agentId=NONE`)).json()
    expect(q.items.some((s: { id: number }) => s.id === sid)).toBe(true)
    const none = await (await call('manager', `/api/schools?query=${encodeURIComponent('Sekolah Uji 7')}&status=EXPIRED`)).json()
    expect(none.items.some((s: { id: number }) => s.id === sid)).toBe(false)
  })
})

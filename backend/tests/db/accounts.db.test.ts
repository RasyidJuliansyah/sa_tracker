import 'dotenv/config'
import bcrypt from 'bcrypt'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/sa_visit_tracker(\?|$)/, '/sa_visit_tracker_test$1')
const ok = !!base && base.includes('sa_visit_tracker_test')
if (ok) { process.env.DATABASE_URL = base; process.env.LOGIN_RATE_LIMIT = '1000' }
const PW = 'Rahasia-Uji-123'

describe.skipIf(!ok)('akun, master data, audit (database uji)', () => {
  let server: Server, url: string
  let prisma: (typeof import('../../src/db.js'))['prisma']
  const stamp = Date.now()
  const em = (r: string) => `${r}${stamp}@b4.test`
  const cookies: Record<string, string> = {}
  const ids: Record<string, number> = {}

  const call = (who: string | null, path: string, method = 'GET', body?: unknown) =>
    fetch(url + path, { method, headers: { 'content-type': 'application/json', origin: 'http://localhost:3010', ...(who ? { cookie: cookies[who]! } : {}) }, body: body ? JSON.stringify(body) : undefined })

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
  })
  afterAll(async () => { server?.close(); await prisma?.$disconnect() })

  it('admin membuat akun: password sementara sekali, hash tersimpan, audit CREATE tanpa rahasia', async () => {
    const r = await call('admin', '/api/users', 'POST', { name: 'Baru', email: em('baru'), role: 'AGENT', timezone: 'WITA' })
    expect(r.status).toBe(201)
    const b = await r.json()
    expect(b.tempPassword).toHaveLength(12)
    expect(b.account.status).toBe('MUST_CHANGE_PASSWORD')
    expect(JSON.stringify(b.account)).not.toMatch(/hash/i)
    const row = await prisma.user.findUnique({ where: { id: b.account.id } })
    expect(await bcrypt.compare(b.tempPassword, row!.passwordHash)).toBe(true)
    const log = await prisma.auditLog.findFirst({ where: { entityType: 'user', entityId: b.account.id, action: 'CREATE' } })
    expect(JSON.stringify(log!.changes)).not.toContain(b.tempPassword)
    expect((await call('admin', '/api/users', 'POST', { name: 'X', email: em('baru'), role: 'AGENT', timezone: 'WIB' })).status).toBe(409)
  })
  it('manager dan agent tidak boleh membuat akun; agent tidak boleh melihat daftar', async () => {
    const body = { name: 'X', email: em('x'), role: 'AGENT', timezone: 'WIB' }
    expect((await call('manager', '/api/users', 'POST', body)).status).toBe(403)
    expect((await call('agent', '/api/users', 'POST', body)).status).toBe(403)
    expect((await call('agent', '/api/users')).status).toBe(403)
    expect((await call(null, '/api/users')).status).toBe(401)
  })
  it('manager hanya melihat dan mengubah agent', async () => {
    const list = (await (await call('manager', '/api/users')).json()).items
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((a: { role: string }) => a.role === 'AGENT')).toBe(true)
    expect((await call('manager', `/api/users/${ids.admin}`, 'PATCH', { name: 'Hack' })).status).toBe(403)
    expect((await call('manager', `/api/users/${ids.agent}`, 'PATCH', { role: 'ADMIN' })).status).toBe(403)
    const ok = await call('manager', `/api/users/${ids.agent}`, 'PATCH', { name: 'Agent Baru', timezone: 'WIT' })
    expect(ok.status).toBe(200)
    expect((await ok.json()).account.timezone).toBe('WIT')
  })
  it('menonaktifkan: audit DEACTIVATE, tidak bisa login lagi; tidak bisa menonaktifkan diri sendiri', async () => {
    expect((await call('admin', `/api/users/${ids.admin}`, 'PATCH', { isActive: false })).status).toBe(409)
    expect((await call('admin', `/api/users/${ids.agent2}`, 'PATCH', { isActive: false })).status).toBe(200)
    expect(await prisma.auditLog.count({ where: { action: 'DEACTIVATE', entityId: ids.agent2 } })).toBe(1)
    expect((await call('agent2', '/api/me')).status).toBe(401)
  })
  it('reset password: sandi lama mati, sandi baru berlaku, status kembali wajib ganti', async () => {
    const r = await call('admin', `/api/users/${ids.manager}/reset-password`, 'POST')
    const { tempPassword } = await r.json()
    const old = await fetch(url + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3010' }, body: JSON.stringify({ email: em('manager'), password: PW }) })
    expect(old.status).toBe(401)
    const fresh = await fetch(url + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3010' }, body: JSON.stringify({ email: em('manager'), password: tempPassword }) })
    expect(fresh.status).toBe(200)
    expect((await call('manager', `/api/users/${ids.manager}/reset-password`, 'POST')).status).toBe(403)
  })
  it('login mengisi last_login_at', async () => {
    const u = await prisma.user.findUnique({ where: { id: ids.admin } })
    expect(u!.lastLoginAt).not.toBeNull()
  })
  it('master data: admin ubah, semua peran baca, nama unik, nonaktif tercatat', async () => {
    const name = `J${stamp}`.slice(0, 28)
    const c = await call('admin', '/api/master/jenjang', 'POST', { name })
    expect(c.status).toBe(201)
    const id = (await c.json()).item.id
    expect((await call('admin', '/api/master/jenjang', 'POST', { name })).status).toBe(409)
    expect((await call('manager', '/api/master/jenjang', 'POST', { name: 'Z' })).status).toBe(403)
    expect((await call('agent', '/api/master/jenjang')).status).toBe(200)
    expect((await call('admin', `/api/master/jenjang/${id}`, 'PATCH', { active: false })).status).toBe(200)
    expect(await prisma.auditLog.count({ where: { action: 'DEACTIVATE', entityType: 'jenjang', entityId: id } })).toBe(1)
    const p = await call('admin', '/api/master/packages', 'POST', { name: `P${stamp}` })
    expect(p.status).toBe(201)
  })
  it('audit log: admin dan manager boleh baca dengan filter, agent tidak', async () => {
    const r = await call('admin', `/api/audit-logs?action=CREATE&entityType=user&pageSize=5`)
    const b = await r.json()
    expect(b.total).toBeGreaterThan(0)
    expect(b.items.every((i: { action: string }) => i.action === 'CREATE')).toBe(true)
    expect((await call('manager', '/api/audit-logs')).status).toBe(200)
    expect((await call('agent', '/api/audit-logs')).status).toBe(403)
    expect((await call('admin', '/api/audit-logs?from=bukan-tanggal')).status).toBe(400)
  })
})

import 'dotenv/config'
import bcrypt from 'bcrypt'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/sa_visit_tracker(\?|$)/, '/sa_visit_tracker_test$1')
const ok = !!base && base.includes('sa_visit_tracker_test')
if (ok) { process.env.DATABASE_URL = base; process.env.LOGIN_RATE_LIMIT = '1000' }

const ORIGIN = 'http://localhost:3010'
const PW = 'Rahasia-Uji-123'

describe.skipIf(!ok)('auth API (database uji)', () => {
  let server: Server
  let url: string
  let prisma: (typeof import('../../src/db.js'))['prisma']
  const stamp = Date.now()
  const email = (r: string) => `${r}${stamp}@uji.test`

  const call = (path: string, init: RequestInit & { cookie?: string } = {}) =>
    fetch(url + path, { ...init, headers: { 'content-type': 'application/json', origin: ORIGIN, ...(init.cookie ? { cookie: init.cookie } : {}) } })
  const loginAs = async (e: string, pw = PW) => {
    const r = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: e, password: pw }) })
    return { r, cookie: r.headers.get('set-cookie')?.split(';')[0] ?? '' }
  }

  beforeAll(async () => {
    ;({ prisma } = await import('../../src/db.js'))
    const { createApp } = await import('../../src/app.js')
    server = createApp().listen(0)
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const passwordHash = await bcrypt.hash(PW, 4)
    await prisma.user.createMany({
      data: [
        { name: 'Admin Uji', email: email('admin'), passwordHash, role: 'ADMIN' },
        { name: 'Agent Uji', email: email('agent'), passwordHash, role: 'AGENT' },
        { name: 'Nonaktif', email: email('off'), passwordHash, role: 'AGENT', isActive: false },
      ],
    })
  })
  afterAll(async () => { server?.close(); await prisma?.$disconnect() })

  it('login benar: cookie httpOnly, tanpa token di body, tercatat LOGIN', async () => {
    const { r, cookie } = await loginAs(email('admin'))
    expect(r.status).toBe(200)
    expect(r.headers.get('set-cookie')).toMatch(/HttpOnly/i)
    expect(r.headers.get('set-cookie')).toMatch(/SameSite=Lax/i)
    const body = await r.json()
    expect(body.user.role).toBe('ADMIN')
    expect(JSON.stringify(body)).not.toMatch(/passwordHash|token/i)
    const me = await call('/api/me', { cookie })
    expect((await me.json()).user.email).toBe(email('admin'))
    const u = await prisma.user.findUnique({ where: { email: email('admin') } })
    expect(await prisma.auditLog.count({ where: { actorId: u!.id, action: 'LOGIN' } })).toBe(1)
  })
  it('password salah, email tidak ada, akun nonaktif: 401 pesan sama, tercatat LOGIN_FAILED', async () => {
    const msgs = new Set<string>()
    for (const [e, pw] of [[email('admin'), 'salah'], [email('tidakada'), PW], [email('off'), PW]] as const) {
      const { r } = await loginAs(e, pw)
      expect(r.status).toBe(401)
      msgs.add((await r.json()).error.message)
    }
    expect(msgs.size).toBe(1)
    expect(await prisma.auditLog.count({ where: { action: 'LOGIN_FAILED' } })).toBeGreaterThanOrEqual(3)
  })
  it('tanpa cookie atau token palsu: 401', async () => {
    expect((await call('/api/me')).status).toBe(401)
    expect((await call('/api/me', { cookie: 'sa_session=abc.def.ghi' })).status).toBe(401)
  })
  it('akun dinonaktifkan setelah login: sesi langsung ditolak', async () => {
    const { cookie } = await loginAs(email('agent'))
    await prisma.user.update({ where: { email: email('agent') }, data: { isActive: false } })
    expect((await call('/api/me', { cookie })).status).toBe(401)
  })
  it('POST dari asal lain ditolak (CSRF)', async () => {
    const r = await fetch(url + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://jahat.example' }, body: '{}' })
    expect(r.status).toBe(403)
  })
  it('input tidak valid: 400', async () => {
    const r = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'bukan-email' }) })
    expect(r.status).toBe(400)
  })
  it('logout menghapus cookie', async () => {
    const r = await call('/api/auth/logout', { method: 'POST' })
    expect(r.status).toBe(204)
    expect(r.headers.get('set-cookie')).toMatch(/sa_session=;/)
  })
})

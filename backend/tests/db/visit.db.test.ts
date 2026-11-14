import 'dotenv/config'
import bcrypt from 'bcrypt'
import { randomInt } from 'node:crypto'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/sa_visit_tracker(\?|$)/, '/sa_visit_tracker_test$1')
const ok = !!base && base.includes('sa_visit_tracker_test')
if (ok) { process.env.DATABASE_URL = base; process.env.LOGIN_RATE_LIMIT = '1000'; process.env.PHOTO_STORAGE_DIR = mkdtempSync(path.join(tmpdir(), 'sa-foto-')) }
const PW = 'Rahasia-Uji-123'
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==', 'base64')

describe.skipIf(!ok)('check-in, check-out, foto (database uji)', () => {
  let server: Server, url: string
  let prisma: (typeof import('../../src/db.js'))['prisma']
  const stamp = Date.now()
  const em = (r: string) => `${r}${stamp}@b7.test`
  const cookies: Record<string, string> = {}
  const ids: Record<string, number> = {}
  let schoolId = 0

  const call = (who: string | null, p: string, method = 'GET', body?: unknown) =>
    fetch(url + p, { method, headers: { 'content-type': 'application/json', origin: 'http://localhost:3010', ...(who ? { cookie: cookies[who]! } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const checkIn = (who: string, fields: Record<string, string> = {}, file: Buffer | null = PNG) => {
    const fd = new FormData()
    for (const [k, v] of Object.entries({ schoolId: String(schoolId), lat: '-6.2', lng: '106.8', accuracy: '12', ...fields })) fd.append(k, v)
    if (file) fd.append('photo', new Blob([new Uint8Array(file)], { type: 'image/png' }), 'x.png')
    return fetch(url + '/api/visits/check-in', { method: 'POST', headers: { origin: 'http://localhost:3010', cookie: cookies[who]! }, body: fd })
  }

  beforeAll(async () => {
    ;({ prisma } = await import('../../src/db.js'))
    server = (await import('../../src/app.js')).createApp().listen(0)
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const passwordHash = await bcrypt.hash(PW, 4)
    for (const [r, role, tz] of [['admin', 'ADMIN', 'WIB'], ['manager', 'MANAGER', 'WIB'], ['agent', 'AGENT', 'WITA'], ['agent2', 'AGENT', 'WIB']] as const) {
      const u = await prisma.user.create({ data: { name: `U ${r}`, email: em(r), passwordHash, role, timezone: tz } })
      ids[r] = u.id
      const res = await fetch(url + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3010' }, body: JSON.stringify({ email: em(r), password: PW }) })
      cookies[r] = res.headers.get('set-cookie')!.split(';')[0]!
    }
    const j = await prisma.jenjang.create({ data: { name: `JB7${stamp}`.slice(0, 28) } })
    const p = await prisma.package.create({ data: { name: `PB7${stamp}` } })
    schoolId = (await prisma.school.create({ data: { npsn: String(randomInt(10000000, 99999999)), name: 'Sekolah B7', jenjangId: j.id, packageId: p.id, partnershipStartDate: new Date('2025-01-01') } })).id
  })
  afterAll(async () => { server?.close(); await prisma?.$disconnect() })

  it('check-in: jam server, zona agent disalin, foto tersimpan, audit tanpa koordinat', async () => {
    const before = Date.now()
    const r = await checkIn('agent')
    expect(r.status).toBe(201)
    const { visit } = await r.json()
    expect(visit.status).toBe('ONGOING')
    expect(visit.timezone).toBe('WITA')
    expect(Math.abs(new Date(visit.checkInAt).getTime() - before)).toBeLessThan(10_000)
    const log = await prisma.auditLog.findFirst({ where: { entityType: 'visit', entityId: visit.id, action: 'CHECK_IN' } })
    expect(JSON.stringify(log!.changes)).not.toMatch(/106\.8|-6\.2|lat|lng/)
  })
  it('satu kunjungan berlangsung per agent; check-in paralel hanya satu yang lolos', async () => {
    expect((await checkIn('agent')).status).toBe(409)
    const res = await Promise.all([checkIn('agent2'), checkIn('agent2'), checkIn('agent2')])
    expect(res.map((r) => r.status).sort()).toEqual([201, 409, 409])
  })
  it('validasi: foto wajib, hanya gambar asli, koordinat valid, hanya agent', async () => {
    const noPhoto = await checkIn('agent2', {}, null)
    expect([400, 409]).toContain(noPhoto.status)
    expect((await checkIn('agent2', {}, Buffer.from('bukan gambar'))).status).toBeGreaterThanOrEqual(400)
    expect((await checkIn('agent2', { lat: '999' })).status).toBe(400)
    expect((await checkIn('manager')).status).toBe(403)
  })
  it('check-out: laporan wajib, hanya pemilik, tidak bisa dua kali', async () => {
    const list = await (await call('agent', '/api/visits?status=ONGOING')).json()
    const id = list.items[0].id
    expect((await call('agent', `/api/visits/${id}/check-out`, 'POST', { report: '   ' })).status).toBe(400)
    expect((await call('agent2', `/api/visits/${id}/check-out`, 'POST', { report: 'curi' })).status).toBe(404)
    const ok = await call('agent', `/api/visits/${id}/check-out`, 'POST', { report: 'Pendampingan guru.' })
    expect(ok.status).toBe(200)
    const v = (await ok.json()).visit
    expect(v.status).toBe('DONE')
    expect(v.durationMinutes).toBeGreaterThanOrEqual(0)
    expect((await call('agent', `/api/visits/${id}/check-out`, 'POST', { report: 'lagi' })).status).toBe(409)
    expect(await prisma.auditLog.count({ where: { action: 'CHECK_OUT', entityId: id } })).toBe(1)
  })
  it('akses: agent hanya kunjungan sendiri; admin/manager semua; foto dijaga', async () => {
    const mine = await (await call('agent', '/api/visits')).json()
    expect(mine.items.every((v: { agentId: number }) => v.agentId === ids.agent)).toBe(true)
    const id = mine.items[0].id
    const all = await (await call('manager', `/api/visits?agentId=${ids.agent2}`)).json()
    expect(all.items.length).toBeGreaterThan(0)
    const otherId = all.items[0].id
    expect((await call('agent', `/api/visits/${otherId}`)).status).toBe(404)
    expect((await call('agent', `/api/visits/${otherId}/photo`)).status).toBe(404)
    expect((await call(null, `/api/visits/${id}/photo`)).status).toBe(401)
    const photo = await call('manager', `/api/visits/${id}/photo`)
    expect(photo.status).toBe(200)
    expect(photo.headers.get('content-type')).toContain('image/png')
    expect(photo.headers.get('x-content-type-options')).toBe('nosniff')
    expect(Buffer.from(await photo.arrayBuffer()).equals(PNG)).toBe(true)
  })
})

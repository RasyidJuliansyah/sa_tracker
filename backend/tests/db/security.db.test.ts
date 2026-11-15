import 'dotenv/config'
import bcrypt from 'bcrypt'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/sa_visit_tracker(\?|$)/, '/sa_visit_tracker_test$1')
const ok = !!base && base.includes('sa_visit_tracker_test')
if (ok) { process.env.DATABASE_URL = base; process.env.LOGIN_RATE_LIMIT = '1000' }
const PW = 'Rahasia-Uji-123'
const HEAD = 'npsn,nama_sekolah,jenjang,paket,zona_waktu,kota,alamat,pic,kontak_pic,id_lms,tanggal_ttd,tanggal_mulai,tanggal_berakhir,nilai_kontrak'

describe.skipIf(!ok)('perbaikan hasil audit keamanan (database uji)', () => {
  let server: Server, url: string
  let prisma: (typeof import('../../src/db.js'))['prisma']
  const stamp = Date.now()
  const em = (r: string) => `${r}${stamp}@sec.test`
  const cookies: Record<string, string> = {}
  const ids: Record<string, number> = {}
  const raw = (p: string, init: RequestInit = {}) => fetch(url + p, { ...init, headers: { 'content-type': 'application/json', origin: 'http://localhost:3010', ...(init.headers as object) } })
  const login = async (r: string, pw = PW) => raw('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: em(r), password: pw }) })

  beforeAll(async () => {
    ;({ prisma } = await import('../../src/db.js'))
    server = (await import('../../src/app.js')).createApp().listen(0)
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const passwordHash = await bcrypt.hash(PW, 4)
    for (const [r, role] of [['admin', 'ADMIN'], ['manager', 'MANAGER'], ['agent', 'AGENT']] as const) {
      ids[r] = (await prisma.user.create({ data: { name: `U ${r}`, email: em(r), passwordHash, role } })).id
      cookies[r] = (await login(r)).headers.get('set-cookie')!.split(';')[0]!
    }
    await prisma.jenjang.create({ data: { name: `JBS${stamp}`.slice(0, 28) } })
    await prisma.package.create({ data: { name: `PBS${stamp}` } })
  })
  afterAll(async () => { server?.close(); await prisma?.$disconnect() })

  it('reset password mencabut sesi lama (token tidak berlaku lagi)', async () => {
    const old = cookies.agent!
    expect((await raw('/api/me', { headers: { cookie: old } })).status).toBe(200)
    const r = await raw(`/api/users/${ids.agent}/reset-password`, { method: 'POST', headers: { cookie: cookies.admin! }, body: '{}' })
    expect(r.status).toBe(200)
    expect((await raw('/api/me', { headers: { cookie: old } })).status).toBe(401)
  })
  it('header keamanan ada dan x-powered-by dimatikan', async () => {
    const r = await raw('/api/health')
    expect(r.headers.get('x-powered-by')).toBeNull()
    expect(r.headers.get('x-content-type-options')).toBe('nosniff')
    expect(r.headers.get('x-frame-options')).toBe('DENY')
    expect(r.headers.get('referrer-policy')).toBe('no-referrer')
  })
  it('LOGIN_FAILED tidak menyimpan teks yang diketik di kolom email', async () => {
    const typed = `salahketik${stamp}@x.test`
    await raw('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: typed, password: 'x' }) })
    const rows = await prisma.auditLog.findMany({ where: { action: 'LOGIN_FAILED' }, orderBy: { id: 'desc' }, take: 20 })
    expect(JSON.stringify(rows.map((r) => r.changes))).not.toContain(typed)
  })
  it('impor: nilai kontrak berformat salah dan kolom kepanjangan ditolak dengan pesan jelas', async () => {
    const jn = (await prisma.jenjang.findFirst({ where: { name: { startsWith: 'JBS' } }, orderBy: { id: 'desc' } }))!.name
    const pk = (await prisma.package.findFirst({ where: { name: { startsWith: 'PBS' } }, orderBy: { id: 'desc' } }))!.name
    const line = (npsn: string, name: string, value: string) => `${npsn},${name},${jn},${pk},WIB,Kota,,,,,2026-01-01,2026-02-01,2027-01-31,${value}`
    const csv = [HEAD, line('11111111', 'A', '"1.500.000,50"'), line('22222222', 'B'.repeat(201), '1000'), line('33333333', 'C', '1.500.000'), line('44444444', 'D', '99999999999999999')].join('\n')
    const r = await (await raw('/api/import/schools/preview', { method: 'POST', headers: { cookie: cookies.manager! }, body: JSON.stringify({ csv }) })).json()
    expect(r.rows[0].ok).toBe(false)
    expect(r.rows[0].message).toContain('Nilai kontrak')
    expect(r.rows[1].message).toContain('Nama sekolah')
    expect(r.rows[2].ok).toBe(true)
    expect(r.rows[2].value).toBe(1_500_000)
    expect(r.rows[3].message).toContain('Nilai kontrak')
  })
  it('check-in ditolak sebelum foto ditulis ke disk bila sudah ada kunjungan berlangsung', async () => {
    const { mkdtempSync } = await import('node:fs')
    const { readdir } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const path = await import('node:path')
    const dir = mkdtempSync(path.join(tmpdir(), 'sa-sec-'))
    process.env.PHOTO_STORAGE_DIR = dir
    vi.resetModules()
    const app = (await import('../../src/app.js')).createApp().listen(0)
    const base2 = `http://127.0.0.1:${(app.address() as AddressInfo).port}`
    const { prisma: db } = await import('../../src/db.js')
    try {
      const login2 = await fetch(base2 + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3010' }, body: JSON.stringify({ email: em('manager'), password: PW }) })
      expect(login2.status).toBe(200)
      // pakai agent baru agar tidak terpengaruh reset password di tes pertama
      const hash = await bcrypt.hash(PW, 4)
      const agent = await db.user.create({ data: { name: 'Agent Foto', email: em('agentfoto'), passwordHash: hash, role: 'AGENT' } })
      const j = await db.jenjang.findFirst({ orderBy: { id: 'desc' } }), p = await db.package.findFirst({ orderBy: { id: 'desc' } })
      const sch = await db.school.create({ data: { npsn: String(55000000 + (stamp % 1000000)), name: 'Sek Sec', jenjangId: j!.id, packageId: p!.id, partnershipStartDate: new Date('2025-01-01') } })
      // Check-in dibatasi (revisi 15): tugaskan sekolah agar lolos izin dan rejection diuji adalah konflik ONGOING (409), bukan 403.
      await db.schoolAssignment.create({ data: { schoolId: sch.id, agentId: agent.id, assignedById: agent.id } })
      await db.visit.create({ data: { agentId: agent.id, schoolId: sch.id, timezone: 'WIB', checkInAt: new Date(), checkInLat: 0, checkInLng: 0, photoPath: 'x.jpg', status: 'ONGOING' } })
      const l = await fetch(base2 + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3010' }, body: JSON.stringify({ email: em('agentfoto'), password: PW }) })
      const cookie = l.headers.get('set-cookie')!.split(';')[0]!
      const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==', 'base64')
      const fd = new FormData()
      for (const [k, v] of Object.entries({ schoolId: String(sch.id), lat: '1', lng: '1' })) fd.append(k, v)
      fd.append('photo', new Blob([new Uint8Array(PNG)], { type: 'image/png' }), 'x.png')
      const r = await fetch(base2 + '/api/visits/check-in', { method: 'POST', headers: { origin: 'http://localhost:3010', cookie }, body: fd })
      expect(r.status).toBe(409)
      expect(await readdir(dir)).toEqual([]) // tidak ada berkas yang sempat ditulis
    } finally {
      app.close()
    }
  })
})

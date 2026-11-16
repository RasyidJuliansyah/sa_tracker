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
// Tanggal WIB hari ini (plan_date memakai WIB).
const todayWib = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)

describe.skipIf(!ok)('rencana kunjungan & pembatasan check-in (database uji)', () => {
  let server: Server, url: string
  let prisma: (typeof import('../../src/db.js'))['prisma']
  const stamp = Date.now()
  const em = (r: string) => `${r}${stamp}@plan.test`
  const cookies: Record<string, string> = {}
  const ids: Record<string, number> = {}
  let assignedSchool = 0 // ditugaskan ke agent
  let otherSchool = 0 // tanpa agent

  const call = (who: string | null, p: string, method = 'GET', body?: unknown) =>
    fetch(url + p, { method, headers: { 'content-type': 'application/json', origin: 'http://localhost:3010', ...(who ? { cookie: cookies[who]! } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const checkIn = (who: string, schoolId: number) => {
    const fd = new FormData()
    for (const [k, v] of Object.entries({ schoolId: String(schoolId), lat: '-6.2', lng: '106.8', accuracy: '12' })) fd.append(k, v)
    fd.append('photo', new Blob([new Uint8Array(PNG)], { type: 'image/png' }), 'x.png')
    return fetch(url + '/api/visits/check-in', { method: 'POST', headers: { origin: 'http://localhost:3010', cookie: cookies[who]! }, body: fd })
  }
  const mkSchool = async (name: string) => (await prisma.school.create({ data: { npsn: String(randomInt(10000000, 99999999)), name, jenjangId: ids.jenjang!, packageId: ids.pkg!, partnershipStartDate: new Date('2025-01-01') } })).id

  beforeAll(async () => {
    ;({ prisma } = await import('../../src/db.js'))
    server = (await import('../../src/app.js')).createApp().listen(0)
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const passwordHash = await bcrypt.hash(PW, 4)
    for (const [r, role] of [['admin', 'ADMIN'], ['manager', 'MANAGER'], ['agent', 'AGENT'], ['other', 'AGENT']] as const) {
      const u = await prisma.user.create({ data: { name: `U ${r}`, email: em(r), passwordHash, role, timezone: 'WIB' } })
      ids[r] = u.id
      const res = await fetch(url + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3010' }, body: JSON.stringify({ email: em(r), password: PW }) })
      cookies[r] = res.headers.get('set-cookie')!.split(';')[0]!
    }
    ids.jenjang = (await prisma.jenjang.create({ data: { name: `JP${stamp}`.slice(0, 28) } })).id
    ids.pkg = (await prisma.package.create({ data: { name: `PP${stamp}` } })).id
    assignedSchool = await mkSchool('Sekolah Ditugaskan')
    otherSchool = await mkSchool('Sekolah Lain')
    await prisma.schoolAssignment.create({ data: { schoolId: assignedSchool, agentId: ids.agent!, assignedById: ids.admin! } })
  })
  afterAll(async () => { server?.close(); await prisma?.$disconnect() })

  it('rencana ke sekolah yang ditugaskan langsung Terjadwal, tanpa pemutus', async () => {
    const r = await call('agent', '/api/visit-plans', 'POST', { schoolId: assignedSchool, planDate: todayWib, purpose: 'Pendampingan guru kelas 7' })
    expect(r.status).toBe(201)
    const { plan } = await r.json()
    expect(plan.status).toBe('APPROVED')
    expect(plan.source).toBe('SELF')
    expect(plan.decidedBy).toBeNull()
    const log = await prisma.auditLog.findFirst({ where: { entityType: 'visit_plan', entityId: plan.id, action: 'CREATE' } })
    expect(log).not.toBeNull()
  })

  it('rencana ke sekolah lain menjadi pengajuan Menunggu persetujuan', async () => {
    const r = await call('agent', '/api/visit-plans', 'POST', { schoolId: otherSchool, planDate: todayWib, purpose: 'Perkenalan paket baru' })
    expect(r.status).toBe(201)
    expect((await r.json()).plan.status).toBe('PENDING')
  })

  it('validasi tanggal & tujuan: masa lalu, >90 hari, tujuan terlalu pendek ditolak 400', async () => {
    const past = new Date(Date.now() - 86400_000 + 7 * 3600_000).toISOString().slice(0, 10)
    const far = new Date(Date.now() + 91 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10)
    expect((await call('agent', '/api/visit-plans', 'POST', { schoolId: assignedSchool, planDate: past, purpose: 'Kunjungan rutin' })).status).toBe(400)
    expect((await call('agent', '/api/visit-plans', 'POST', { schoolId: assignedSchool, planDate: far, purpose: 'Kunjungan rutin' })).status).toBe(400)
    expect((await call('agent', '/api/visit-plans', 'POST', { schoolId: assignedSchool, planDate: todayWib, purpose: 'abc' })).status).toBe(400)
  })

  it('rencana aktif ganda untuk sekolah+tanggal sama ditolak 409', async () => {
    const r = await call('agent', '/api/visit-plans', 'POST', { schoolId: assignedSchool, planDate: todayWib, purpose: 'Duplikat rencana' })
    expect(r.status).toBe(409)
  })

  it('check-in ditolak 403 di sekolah tanpa tugas & tanpa rencana terjadwal', async () => {
    // agent "other" tidak ditugaskan ke mana pun dan tidak punya rencana.
    const r = await checkIn('other', otherSchool)
    expect(r.status).toBe(403)
    expect((await r.json()).error.message).toMatch(/bukan tugas Anda/i)
  })

  it('check-in ke sekolah lain dengan pengajuan masih menunggu ditolak 403 dengan pesan menunggu', async () => {
    // agent punya pengajuan PENDING untuk otherSchool (dibuat di test ke-2).
    const r = await checkIn('agent', otherSchool)
    expect(r.status).toBe(403)
    expect((await r.json()).error.message).toMatch(/menunggu persetujuan/i)
  })

  it('check-in di sekolah yang ditugaskan berhasil dan terhubung ke rencana terjadwal (plan_id terisi)', async () => {
    const r = await checkIn('agent', assignedSchool)
    expect(r.status).toBe(201)
    const { visit } = await r.json()
    expect(visit.plan).not.toBeNull()
    expect(visit.plan.source).toBe('SELF')
    // rencana tetap Terjadwal selama kunjungan ONGOING, belum Selesai.
    const planId = visit.plan.id
    const before = (await (await call('agent', `/api/visit-plans/${planId}`)).json()).plan
    expect(before.status).toBe('APPROVED')
    // check-out -> rencana menjadi Selesai.
    await call('agent', `/api/visits/${visit.id}/check-out`, 'POST', { report: 'Pendampingan selesai.' })
    const after = (await (await call('agent', `/api/visit-plans/${planId}`)).json()).plan
    expect(after.status).toBe('DONE')
    expect(after.visitId).toBe(visit.id)
  })

  it('rencana yang sudah punya kunjungan tidak bisa dibatalkan (409)', async () => {
    const list = await (await call('agent', '/api/visit-plans?upcoming=false')).json()
    const done = list.items.find((p: { status: string }) => p.status === 'DONE')
    expect(done).toBeTruthy()
    expect((await call('agent', `/api/visit-plans/${done.id}/cancel`, 'POST')).status).toBe(409)
  })

  it('agent hanya melihat rencananya sendiri; rencana agent lain -> 404', async () => {
    const r = await call('agent', '/api/visit-plans', 'POST', { schoolId: assignedSchool, planDate: new Date(Date.now() + 2 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10), purpose: 'Rencana mendatang' })
    const id = (await r.json()).plan.id
    expect((await call('other', `/api/visit-plans/${id}`)).status).toBe(404)
    // dan "other" tidak melihatnya di daftarnya
    const mine = await (await call('other', '/api/visit-plans')).json()
    expect(mine.items.every((p: { agentId: number }) => p.agentId === ids.other)).toBe(true)
  })

  it('agent bisa membatalkan rencananya sendiri, tapi tidak bisa membatalkan jadwal dari manager', async () => {
    // rencana sendiri (mendatang) bisa dibatalkan
    const own = await call('agent', '/api/visit-plans', 'POST', { schoolId: assignedSchool, planDate: new Date(Date.now() + 3 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10), purpose: 'Rencana yang akan dibatalkan' })
    const ownId = (await own.json()).plan.id
    const cancelled = await call('agent', `/api/visit-plans/${ownId}/cancel`, 'POST')
    expect(cancelled.status).toBe(200)
    expect((await cancelled.json()).plan.status).toBe('CANCELLED')
    // jadwal dari manager untuk agent -> agent tidak boleh membatalkan (403)
    const jadwal = await call('manager', '/api/visit-plans', 'POST', { agentId: ids.agent, schoolId: otherSchool, planDate: new Date(Date.now() + 4 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10), purpose: 'Jadwal dari manager' })
    expect(jadwal.status).toBe(201)
    const jadwalId = (await jadwal.json()).plan.id
    expect((await call('agent', `/api/visit-plans/${jadwalId}/cancel`, 'POST')).status).toBe(403)
  })

  const futureWib = (n: number) => new Date(Date.now() + n * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10)

  it('agent bukan manager/admin ditolak 403 saat approve/reject', async () => {
    const r = await call('agent', '/api/visit-plans', 'POST', { schoolId: otherSchool, planDate: futureWib(10), purpose: 'Pengajuan untuk ditolak peran' })
    const id = (await r.json()).plan.id
    expect((await call('agent', `/api/visit-plans/${id}/approve`, 'POST', {})).status).toBe(403)
  })

  it('tolak tanpa alasan ditolak 400; dengan alasan berhasil dan agent melihat alasannya (FR-10, FR-11)', async () => {
    const r = await call('agent', '/api/visit-plans', 'POST', { schoolId: otherSchool, planDate: futureWib(11), purpose: 'Pengajuan yang akan ditolak' })
    const id = (await r.json()).plan.id
    expect((await call('manager', `/api/visit-plans/${id}/reject`, 'POST', {})).status).toBe(400)
    const rej = await call('manager', `/api/visit-plans/${id}/reject`, 'POST', { note: 'Agen tidak bertugas di sekolah ini' })
    expect(rej.status).toBe(200)
    const { plan } = await rej.json()
    expect(plan.status).toBe('REJECTED')
    expect(plan.decisionNote).toBe('Agen tidak bertugas di sekolah ini')
    expect(plan.decidedBy).toBe('U manager')
    const seen = (await (await call('agent', `/api/visit-plans/${id}`)).json()).plan
    expect(seen.decisionNote).toBe('Agen tidak bertugas di sekolah ini')
  })

  it('pengajuan yang sudah diputus tidak bisa diputus lagi (409)', async () => {
    const r = await call('agent', '/api/visit-plans', 'POST', { schoolId: otherSchool, planDate: futureWib(12), purpose: 'Pengajuan diputus dua kali' })
    const id = (await r.json()).plan.id
    expect((await call('manager', `/api/visit-plans/${id}/approve`, 'POST', {})).status).toBe(200)
    expect((await call('manager', `/api/visit-plans/${id}/approve`, 'POST', {})).status).toBe(409)
  })

  it('setujui (catatan opsional) lalu check-in berhasil (FR-8..FR-12); school_assignments tidak berubah', async () => {
    // agent "other" tidak ditugaskan ke otherSchool dan belum punya rencana hari ini di sana.
    const before = await prisma.schoolAssignment.count()
    const r = await call('other', '/api/visit-plans', 'POST', { schoolId: otherSchool, planDate: todayWib, purpose: 'Pengajuan untuk disetujui hari ini' })
    const id = (await r.json()).plan.id
    const detail = await call('manager', `/api/visit-plans/${id}/decision`)
    expect(detail.status).toBe(200)
    const d = await detail.json()
    expect(d.school.id).toBe(otherSchool)
    expect(Array.isArray(d.recentVisits)).toBe(true)
    const appr = await call('manager', `/api/visit-plans/${id}/approve`, 'POST', { note: 'Oke, silakan.' })
    expect(appr.status).toBe(200)
    expect((await appr.json()).plan.status).toBe('APPROVED')
    expect(await prisma.schoolAssignment.count()).toBe(before)
    const ci = await checkIn('other', otherSchool)
    expect(ci.status).toBe(201)
  })

  it('pengajuan yang tanggalnya sudah lewat tidak bisa diputus (409)', async () => {
    const past = await prisma.visitPlan.create({ data: { agentId: ids.agent!, schoolId: otherSchool, planDate: new Date(`${new Date(Date.now() - 2 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10)}T00:00:00Z`), purpose: 'Pengajuan lampau', status: 'PENDING', createdById: ids.agent! } })
    expect((await call('manager', `/api/visit-plans/${past.id}/approve`, 'POST', {})).status).toBe(409)
  })
})

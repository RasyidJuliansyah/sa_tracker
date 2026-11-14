import 'dotenv/config'
import bcrypt from 'bcrypt'
import { randomInt } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/sa_visit_tracker(\?|$)/, '/sa_visit_tracker_test$1')
const ok = !!base && base.includes('sa_visit_tracker_test')
if (ok) { process.env.DATABASE_URL = base; process.env.LOGIN_RATE_LIMIT = '1000' }
const PW = 'Rahasia-Uji-123'

describe.skipIf(!ok)('impor dan ekspor CSV (database uji)', () => {
  let server: Server, url: string
  let prisma: (typeof import('../../src/db.js'))['prisma']
  const stamp = Date.now()
  const em = (r: string) => `${r}${stamp}@b9.test`
  const cookies: Record<string, string> = {}
  let jn = '', pk = ''
  const n1 = String(randomInt(10000000, 99999999)), n2 = String(randomInt(10000000, 99999999) ), n3 = String(randomInt(10000000, 99999999))
  const HEAD = 'npsn,nama_sekolah,jenjang,paket,zona_waktu,kota,alamat,pic,kontak_pic,id_lms,tanggal_ttd,tanggal_mulai,tanggal_berakhir,nilai_kontrak'

  const call = (who: string, p: string, method = 'GET', body?: unknown) =>
    fetch(url + p, { method, headers: { 'content-type': 'application/json', origin: 'http://localhost:3010', cookie: cookies[who]! }, body: body ? JSON.stringify(body) : undefined })

  beforeAll(async () => {
    ;({ prisma } = await import('../../src/db.js'))
    server = (await import('../../src/app.js')).createApp().listen(0)
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const passwordHash = await bcrypt.hash(PW, 4)
    for (const [r, role] of [['manager', 'MANAGER'], ['agent', 'AGENT']] as const) {
      await prisma.user.create({ data: { name: `U ${r}`, email: em(r), passwordHash, role } })
      const res = await fetch(url + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:3010' }, body: JSON.stringify({ email: em(r), password: PW }) })
      cookies[r] = res.headers.get('set-cookie')!.split(';')[0]!
    }
    jn = `JB9${stamp}`.slice(0, 28); pk = `PB9${stamp}`
    await prisma.jenjang.create({ data: { name: jn } })
    await prisma.package.create({ data: { name: pk } })
  })
  afterAll(async () => { server?.close(); await prisma?.$disconnect() })

  it('pratinjau: baris valid/gagal tanpa menyimpan; jenjang dan paket dicocokkan nama', async () => {
    const csv = [HEAD,
      `${n1},Sekolah Impor 1,${jn},${pk},WIB,Bogor,Jl A,Ibu A,0812,,2026-01-01,2026-02-01,2027-01-31,50000000`,
      `${n2},Sekolah Impor 2,JENJANG-TAK-ADA,${pk},,,,,,,,,,`,
      `${n1},Dobel,${jn},${pk},,,,,,,2026-01-01,2026-02-01,2027-01-31,1000`,
      `,Tanpa NPSN,${jn},${pk},,,,,,,,,,`,
      `${n3},Tanpa Kontrak,${jn},${pk},,,,,,,,,,`,
    ].join('\n')
    const r = await (await call('manager', '/api/import/schools/preview', 'POST', { csv })).json()
    expect(r.rows.map((x: { ok: boolean }) => x.ok)).toEqual([true, false, false, false, false])
    expect(r.rows[1].message).toContain('tidak ada di master jenjang')
    expect(r.rows[2].message).toContain('ganda')
    expect(r.rows[4].message).toContain('Kontrak pertama wajib')
    expect(await prisma.school.count({ where: { npsn: n1 } })).toBe(0)
    expect((await (await call('manager', '/api/import/schools/preview', 'POST', { csv: 'a,b\n1,2' })).json()).fileError).toContain('Kolom wajib')
  })
  it('simpan: sekolah baru + kontrak pertama, audit IMPORT per baris; NPSN yang ada diperbarui, bukan diduplikasi', async () => {
    const csv = [HEAD, `${n1},Sekolah Impor 1,${jn},${pk},WIB,Bogor,Jl A,Ibu A,0812,,2026-01-01,2026-02-01,2027-01-31,50000000`, `${n2},Gagal,TAK-ADA,${pk},,,,,,,,,,`].join('\n')
    const r = await (await call('manager', '/api/import/schools/commit', 'POST', { csv })).json()
    expect(r).toMatchObject({ created: 1, updated: 0 })
    expect(r.failed).toHaveLength(1)
    const s = await prisma.school.findUnique({ where: { npsn: n1 }, include: { contracts: true } })
    expect(s!.contracts).toHaveLength(1)
    expect(Number(s!.contracts[0]!.contractValue)).toBe(50_000_000)
    expect(await prisma.auditLog.count({ where: { action: 'IMPORT', entityType: 'school', entityId: s!.id } })).toBe(1)
    const again = `${HEAD}\n${n1},Sekolah Impor 1 Baru,${jn},${pk},WIB,Depok,Jl B,Ibu B,0813,,,,,`
    const r2 = await (await call('manager', '/api/import/schools/commit', 'POST', { csv: again })).json()
    expect(r2).toMatchObject({ created: 0, updated: 1 })
    expect(await prisma.school.count({ where: { npsn: n1 } })).toBe(1)
    expect((await prisma.school.findUnique({ where: { npsn: n1 } }))!.city).toBe('Depok')
  })
  it('agent tidak boleh impor atau ekspor', async () => {
    expect((await call('agent', '/api/import/schools/preview', 'POST', { csv: HEAD })).status).toBe(403)
    expect((await call('agent', '/api/export/schools')).status).toBe(403)
  })
  it('ekspor sekolah: UTF-8 BOM, sel berbahaya dinetralkan, tercatat EXPORT; dryRun tidak mencatat', async () => {
    await prisma.school.update({ where: { npsn: n1 }, data: { name: '=HYPERLINK("http://jahat")' } })
    const before = await prisma.auditLog.count({ where: { action: 'EXPORT' } })
    const dry = await (await call('manager', '/api/export/schools?dryRun=1')).json()
    expect(dry.rows).toBeGreaterThan(0)
    expect(await prisma.auditLog.count({ where: { action: 'EXPORT' } })).toBe(before)
    const res = await call('manager', '/api/export/schools')
    const buf = Buffer.from(await res.arrayBuffer())
    expect([...buf.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]) // UTF-8 BOM
    const text = buf.toString('utf8')
    expect(res.headers.get('content-type')).toContain('text/csv')
    expect(text).toContain(`'=HYPERLINK`)
    expect(text).not.toMatch(/,=HYPERLINK|^=HYPERLINK/m)
    expect(await prisma.auditLog.count({ where: { action: 'EXPORT' } })).toBe(before + 1)
    const log = (await (await call('manager', '/api/export/log')).json()).items
    expect(log[0]).toMatchObject({ kind: 'Data sekolah' })
  })
  it('ekspor kontrak dan kunjungan memakai filter', async () => {
    const c = await call('manager', '/api/export/contracts?year=2027')
    expect(c.status).toBe(200)
    expect((await c.text()).split('\r\n')[0]).toContain('Retention (%)')
    expect((await call('manager', '/api/export/visits?from=2026-01-01&to=2026-01-02')).status).toBe(200)
    expect((await call('manager', '/api/export/visits?from=salah')).status).toBe(400)
  })
})

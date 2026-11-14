import 'dotenv/config'
import { afterAll, describe, expect, it } from 'vitest'

// Tes integrasi database: hanya ke sa_visit_tracker_test (jalankan scripts/reset-test-db.sh dulu).
const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/sa_visit_tracker(\?|$)/, '/sa_visit_tracker_test$1')
const ok = !!base && base.includes('sa_visit_tracker_test')
if (ok) process.env.DATABASE_URL = base

describe.skipIf(!ok)('withAudit (database uji)', () => {
  const load = async () => ({ ...(await import('../../src/services/audit.js')), ...(await import('../../src/db.js')) })
  afterAll(async () => { const { prisma } = await load(); await prisma.$disconnect() })

  it('perubahan dan audit ditulis bersama', async () => {
    const { withAudit, prisma } = await load()
    const name = `Jenjang uji ${Date.now()}`
    const row = await withAudit(async (tx) => {
      const r = await tx.jenjang.create({ data: { name } })
      return { result: r, audit: { actorId: null, action: 'CREATE', entityType: 'jenjang', entityId: r.id, changes: { after: { name } } } }
    })
    const log = await prisma.auditLog.findFirst({ where: { entityType: 'jenjang', entityId: row.id } })
    expect(log?.action).toBe('CREATE')
  })

  it('gagal menulis audit = perubahan data dibatalkan', async () => {
    const { withAudit, prisma } = await load()
    const name = `Jenjang batal ${Date.now()}`
    await expect(
      withAudit(async (tx) => {
        const r = await tx.jenjang.create({ data: { name } })
        // actorId tidak ada -> pelanggaran foreign key pada audit_logs
        return { result: r, audit: { actorId: 999999, action: 'CREATE', entityType: 'jenjang', entityId: r.id } }
      }),
    ).rejects.toThrow()
    expect(await prisma.jenjang.findFirst({ where: { name } })).toBeNull()
  })
})

// Seed KHUSUS TES/DEV. Jangan dijalankan di produksi.
// Berisi contoh sekolah A dan B dari docs/PLAN.md (Retention dan target), ditambah kasus
// perpanjangan lebih besar, tidak diperpanjang, belum jatuh tempo, dan diperpanjang lebih awal.
import bcrypt from 'bcrypt'
import { prisma } from '../src/db.js'
import type { IndoTimezone } from '../src/generated/prisma/client.js'

const SEED_PASSWORD = 'Password123!'
const OFFSET_HOURS: Record<IndoTimezone, number> = { WIB: 7, WITA: 8, WIT: 9 }
const d = (s: string) => new Date(`${s}T00:00:00.000Z`)
const JT = 1_000_000

async function reset() {
  // Urutan mengikuti foreign key. Hanya untuk database dev/tes.
  for (const t of ['audit_logs', 'visits', 'school_assignments', 'school_contracts', 'schools', 'retention_targets', 'jenjang', 'packages', 'users']) {
    await prisma.$executeRawUnsafe(`DELETE FROM \`${t}\``)
  }
}

async function main() {
  await reset()
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)

  const mkUser = (name: string, email: string, role: 'ADMIN' | 'MANAGER' | 'AGENT', timezone: IndoTimezone) =>
    prisma.user.create({ data: { name, email, role, timezone, passwordHash, mustChangePassword: false } })

  const admin = await mkUser('Admin Skolla', 'admin@skolla.test', 'ADMIN', 'WIB')
  const manager = await mkUser('Maya Manager', 'manager@skolla.test', 'MANAGER', 'WIB')
  const citra = await mkUser('Citra Agent', 'citra@skolla.test', 'AGENT', 'WIB')
  const dimas = await mkUser('Dimas Agent', 'dimas@skolla.test', 'AGENT', 'WITA')
  const eko = await mkUser('Eko Agent', 'eko@skolla.test', 'AGENT', 'WIT')

  const sd = await prisma.jenjang.create({ data: { name: 'SD' } })
  const smp = await prisma.jenjang.create({ data: { name: 'SMP' } })
  const sma = await prisma.jenjang.create({ data: { name: 'SMA' } })
  const basic = await prisma.package.create({ data: { name: 'Skolla Basic' } })
  const plus = await prisma.package.create({ data: { name: 'Skolla Plus' } })

  await prisma.retentionTarget.create({ data: { year: 2026, targetPercent: 65, setById: admin.id } })

  type Spec = {
    key: string; npsn: string; name: string; jenjangId: number; packageId: number; timezone: IndoTimezone
    start: string; end: string; value: number; signed: string
    renewal?: { signed: string; start: string; end: string; value: number }
    agent?: number; formerAgent?: number
  }
  const specs: Spec[] = [
    // A dan B: contoh terkonfirmasi di PLAN.md. Agent C = Citra, agent D = Dimas
    { key: 'A', npsn: '10000001', name: 'SMA Sekolah A', jenjangId: sma.id, packageId: plus.id, timezone: 'WIB', start: '2025-03-01', end: '2026-02-28', value: 80 * JT, signed: '2025-02-10',
      renewal: { signed: '2026-01-15', start: '2026-03-01', end: '2027-02-28', value: 80 * JT }, agent: citra.id },
    { key: 'B', npsn: '10000002', name: 'SMP Sekolah B', jenjangId: smp.id, packageId: basic.id, timezone: 'WITA', start: '2025-04-01', end: '2026-03-31', value: 20 * JT, signed: '2025-03-12',
      renewal: { signed: '2026-03-10', start: '2026-04-01', end: '2027-03-31', value: 10 * JT }, agent: dimas.id },
    // Perpanjangan lebih besar (130%)
    { key: 'C', npsn: '10000003', name: 'SD Sekolah C', jenjangId: sd.id, packageId: basic.id, timezone: 'WIB', start: '2025-06-01', end: '2026-05-31', value: 50 * JT, signed: '2025-05-15',
      renewal: { signed: '2026-05-02', start: '2026-06-01', end: '2027-05-31', value: 65 * JT }, agent: citra.id },
    // Sudah lewat berakhir, tidak diperpanjang. Dulu dipegang Citra, sekarang Dimas
    { key: 'D', npsn: '10000004', name: 'SMA Sekolah D', jenjangId: sma.id, packageId: plus.id, timezone: 'WITA', start: '2025-07-01', end: '2026-06-30', value: 40 * JT, signed: '2025-06-20',
      agent: dimas.id, formerAgent: citra.id },
    // Berakhir akhir tahun, belum diperpanjang
    { key: 'E', npsn: '10000005', name: 'SMK Sekolah E', jenjangId: sma.id, packageId: plus.id, timezone: 'WIT', start: '2025-12-16', end: '2026-12-15', value: 60 * JT, signed: '2025-12-01', agent: eko.id },
    // Berakhir 2027, tanpa agent
    { key: 'F', npsn: '10000006', name: 'SD Sekolah F', jenjangId: sd.id, packageId: basic.id, timezone: 'WIB', start: '2026-02-01', end: '2027-01-31', value: 30 * JT, signed: '2026-01-20' },
    // Diperpanjang lebih awal (ditandatangani 3 Nov 2026 untuk kontrak yang berakhir 15 Des 2026), nilai sama
    { key: 'G', npsn: '10000007', name: 'SMP Sekolah G', jenjangId: smp.id, packageId: basic.id, timezone: 'WIT', start: '2025-12-16', end: '2026-12-15', value: 45 * JT, signed: '2025-12-05',
      renewal: { signed: '2026-11-03', start: '2026-12-16', end: '2027-12-15', value: 45 * JT }, agent: eko.id },
  ]

  const schoolIds: Record<string, number> = {}
  for (const s of specs) {
    const school = await prisma.school.create({
      data: {
        npsn: s.npsn, name: s.name, jenjangId: s.jenjangId, packageId: s.packageId, timezone: s.timezone,
        partnershipStartDate: d(s.start), onboardingDate: d(s.start), activeSinceDate: d(s.start), partnershipEndDate: d(s.renewal?.end ?? s.end),
        city: 'Kota Contoh', picName: `PIC ${s.key}`, picContact: '0812-0000-0000',
      },
    })
    schoolIds[s.key] = school.id
    const first = await prisma.schoolContract.create({
      data: { schoolId: school.id, contractType: 'NEW', signedDate: d(s.signed), contractStartDate: d(s.start), contractEndDate: d(s.end), contractValue: s.value, createdById: manager.id },
    })
    if (s.renewal) {
      await prisma.schoolContract.create({
        data: { schoolId: school.id, contractType: 'RENEWAL', previousContractId: first.id, signedDate: d(s.renewal.signed), contractStartDate: d(s.renewal.start), contractEndDate: d(s.renewal.end), contractValue: s.renewal.value, createdById: manager.id },
      })
    }
    if (s.formerAgent) {
      await prisma.schoolAssignment.create({
        data: { schoolId: school.id, agentId: s.formerAgent, assignedById: manager.id, assignedAt: d(s.start), unassignedAt: d('2026-03-01') },
      })
    }
    if (s.agent) {
      await prisma.schoolAssignment.create({
        data: { schoolId: school.id, agentId: s.agent, assignedById: manager.id, assignedAt: s.formerAgent ? d('2026-03-01') : d(s.start) },
      })
    }
  }

  // Kunjungan hari kerja 14 Sep - 13 Nov 2026. Tiap agent mengunjungi sekolah miliknya bergantian,
  // dan sesekali sekolah lain (tidak ditugaskan). Jam masuk 09.00-11.00 waktu agent, durasi 45-120 menit.
  const agents = [
    { user: citra, schools: ['A', 'C'], other: 'F' },
    { user: dimas, schools: ['B', 'D'], other: 'A' },
    { user: eko, schools: ['E', 'G'], other: 'C' },
  ]
  let n = 0
  for (let day = d('2026-09-14'); day <= d('2026-11-13'); day = new Date(day.getTime() + 86_400_000)) {
    const dow = day.getUTCDay()
    if (dow === 0 || dow === 6) continue
    for (const [i, a] of agents.entries()) {
      if ((n + i) % 4 === 3) continue // tidak setiap hari berkunjung
      const key = (n + i) % 5 === 4 ? a.other : a.schools[(n + i) % a.schools.length]!
      const startHour = 9 + ((n + i) % 3)
      const checkIn = new Date(day.getTime() + (startHour - OFFSET_HOURS[a.user.timezone]) * 3_600_000)
      const minutes = 45 + ((n * 7 + i * 13) % 76)
      await prisma.visit.create({
        data: {
          agentId: a.user.id, schoolId: schoolIds[key]!, timezone: a.user.timezone, checkInAt: checkIn,
          checkInLat: -6.2 + i * 0.01, checkInLng: 106.8 + i * 0.01, checkInAccuracy: 12,
          photoPath: `seed/visit-${n}-${i}.jpg`, checkOutAt: new Date(checkIn.getTime() + minutes * 60_000),
          report: `Kunjungan rutin ke ${key}. Kondisi LMS berjalan baik.`, status: 'DONE',
        },
      })
    }
    n++
  }
  // Satu kunjungan yang sedang berlangsung
  await prisma.visit.create({
    data: {
      agentId: citra.id, schoolId: schoolIds.A!, timezone: 'WIB', checkInAt: new Date(Date.now() - 30 * 60_000),
      checkInLat: -6.2, checkInLng: 106.8, checkInAccuracy: 10, photoPath: 'seed/visit-ongoing.jpg', status: 'ONGOING',
    },
  })

  console.log(`Seed selesai. Password semua akun: ${SEED_PASSWORD}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())

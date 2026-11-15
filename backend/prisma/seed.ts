// Seed KHUSUS TES/DEV. Jangan dijalankan di produksi.
// Berisi akun login awal (admin, manager, 3 agent) dan master data (jenjang, paket).
// Sekolah, kontrak, penugasan, kunjungan, dan target retention sengaja KOSONG:
// data asli diisi lewat aplikasi (impor CSV sekolah/akun atau input manual) oleh Skolla Edtech.
import bcrypt from 'bcrypt'
import { prisma } from '../src/db.js'
import type { IndoTimezone } from '../src/generated/prisma/client.js'

const SEED_PASSWORD = 'SkollaEdu'

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

  await mkUser('Admin Skolla', 'admin@skolla.education', 'ADMIN', 'WIB')
  await mkUser('Maya Manager', 'manager@skolla.education', 'MANAGER', 'WIB')
  await mkUser('Citra Agent', 'citra@skolla.education', 'AGENT', 'WIB')
  await mkUser('Dimas Agent', 'dimas@skolla.education', 'AGENT', 'WITA')
  await mkUser('Eko Agent', 'eko@skolla.education', 'AGENT', 'WIT')

  await prisma.jenjang.create({ data: { name: 'SD' } })
  await prisma.jenjang.create({ data: { name: 'SMP' } })
  await prisma.jenjang.create({ data: { name: 'SMA' } })
  await prisma.package.create({ data: { name: 'Skolla Basic' } })
  await prisma.package.create({ data: { name: 'Skolla Plus' } })

  // Sekolah, kontrak, penugasan, kunjungan, retention target: sengaja tidak di-seed.
  // ponytail: ceiling ini cuma data kosong buat tes manual; isi lewat impor CSV sekolah/akun
  // di aplikasi (AkunImportExportView/SekolahImportExportView), bukan lewat seed.

  console.log(`Seed selesai (akun + master data saja). Password semua akun: ${SEED_PASSWORD}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())

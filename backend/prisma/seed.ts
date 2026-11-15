// Seed KHUSUS TES/DEV. Jangan dijalankan di produksi.
// Berisi 3 akun awal (admin, manager, agent) dan master data (jenjang, paket). Sekolah,
// kontrak, penugasan, kunjungan, dan target retention sengaja KOSONG: diisi lewat aplikasi.
import bcrypt from "bcrypt";
import { prisma } from "../src/db.js";
import type { IndoTimezone } from "../src/generated/prisma/client.js";

const SEED_PASSWORD = "SkollaEdu";

async function reset() {
  // Urutan mengikuti foreign key. Hanya untuk database dev/tes.
  for (const t of [
    "audit_logs",
    "visits",
    "school_assignments",
    "school_contracts",
    "schools",
    "retention_targets",
    "jenjang",
    "packages",
    "users",
  ]) {
    await prisma.$executeRawUnsafe(`DELETE FROM \`${t}\``);
  }
}

async function main() {
  await reset();
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const mkUser = (
    name: string,
    email: string,
    role: "ADMIN" | "MANAGER" | "AGENT",
    timezone: IndoTimezone,
  ) =>
    prisma.user.create({
      data: { name, email, role, timezone, passwordHash, mustChangePassword: false },
    });

  await mkUser("Admin", "admin@skolla.education", "ADMIN", "WIB");
  await mkUser("Syifa Mahmudah", "syifa@skolla.education", "MANAGER", "WIB");
  await mkUser("Akhmad Mukhibun", "akhmad@skolla.education", "AGENT", "WIB");

  await prisma.jenjang.create({ data: { name: "SD" } });
  await prisma.jenjang.create({ data: { name: "SMP" } });
  await prisma.jenjang.create({ data: { name: "SMA" } });
  await prisma.package.create({ data: { name: "Skolla Basic" } });
  await prisma.package.create({ data: { name: "Skolla Plus" } });

  // Sekolah, kontrak, penugasan, kunjungan, retention target: sengaja tidak di-seed,
  // diisi lewat aplikasi (impor CSV atau form) oleh Skolla Edtech.

  console.log(`Seed selesai. Password semua akun: ${SEED_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

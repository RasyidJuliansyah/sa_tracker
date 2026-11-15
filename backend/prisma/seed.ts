// Seed KHUSUS TES/DEV. Jangan dijalankan di produksi.
// Berisi HANYA master data (jenjang, paket). Akun login, sekolah, kontrak, penugasan,
// kunjungan, dan target retention sengaja KOSONG: diisi lewat aplikasi (buat akun admin
// pertama manual di DB, atau fitur setup awal) oleh Skolla Edtech.
import { prisma } from "../src/db.js";

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

  await prisma.jenjang.create({ data: { name: "SD" } });
  await prisma.jenjang.create({ data: { name: "SMP" } });
  await prisma.jenjang.create({ data: { name: "SMA" } });
  await prisma.package.create({ data: { name: "Skolla Basic" } });
  await prisma.package.create({ data: { name: "Skolla Plus" } });

  // Akun, sekolah, kontrak, penugasan, kunjungan, retention target: sengaja tidak di-seed.
  // ponytail: ceiling ini cuma master data; buat akun admin pertama manual lewat query
  // INSERT ke tabel `users` (bcrypt password) sebelum bisa login dan isi data lain lewat aplikasi.

  console.log("Seed selesai (master data saja, tanpa akun).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

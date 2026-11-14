# Rencana logic dan backend

Status: disetujui user (14 November 2026), keputusan di bagian "Keputusan". Menggantikan langkah 3–17 di "Urutan kerja" `docs/PLAN.md` sekarang setelah seluruh UI Figma selesai (data tiruan). Aturan bisnis tetap di `docs/PLAN.md`, aturan teknis di `CLAUDE.md` dan `docs/architecture.md`.

## Prinsip

1. **Logika murni dulu, endpoint belakangan.** Rumus retention, kontrak berjalan, periode WIB, dan validasi dikerjakan sebagai modul TypeScript tanpa database, dites Vitest. Ini bagian paling berisiko salah, dan endpoint tinggal membungkusnya.
2. **Satu irisan = satu layar yang hidup.** Setiap tahap diakhiri dengan layar UI yang berpindah dari data tiruan ke API sungguhan, dengan tes E2E terhadap backend nyata.
3. **Kontrak API ditulis sebelum kode.** Daftar endpoint per tahap masuk ke `docs/api-reference.md` (sekarang masih kosong). Bentuk datanya sudah ditetapkan oleh `frontend/src/services/*.ts`: layanan itu adalah antarmuka yang akan diganti, jadi respons API mengikuti tipe yang sudah dipakai layar.
4. **Hak akses di backend, selalu.** Setiap endpoint punya guard peran, dan pembatasan "milik sendiri" untuk AGENT dicek di service.
5. **Perubahan data transaksi = satu transaksi + satu baris `audit_logs`** lewat satu helper.

## Tahapan

Setiap tahap: kerjakan, tes lolos, commit kecil, perbarui `HANDOFF.md`.

### B0. Fondasi backend
- Penanganan galat terpusat (`AppError` + middleware), request id, log JSON per request, validator input (zod).
- Infrastruktur tes: Vitest untuk unit; tes integrasi Python (`tests/integration/`, `APIRequestContext`) terhadap database uji `sa_visit_tracker_test` yang dibuat dari `001_init.sql` dan seed khusus tes.
- Format respons dan galat yang seragam (pesan galat berbahasa Indonesia, kode galat untuk UI).

### B1. Modul logika murni (Vitest, tanpa database)
Semuanya di `backend/src/utils/` atau satu modul service yang tidak menyentuh Prisma:
- Zona waktu (WIB/WITA/WIT), batas hari/minggu/bulan WIB (padanan `frontend/src/components/dashboard/period.ts`).
- Kontrak: berjalan (WIB), berakhir > mulai, periode tidak tumpang tindih, satu perpanjangan per kontrak, perpanjangan wajib `signed_date`.
- **Retention (satu modul):** kohort tahun kalender WIB, retention tidak dibatasi 100%, target, retention per agent (sekolah yang sedang ditugaskan × `share_percent`), status "Sesuai target" dari kontrak yang sudah diputuskan. **Contoh sekolah A dan B dari PLAN.md wajib jadi tes** (agent C 100%, D 50%, manager Rp 90 jt dari target minimal Rp 65 jt = 90%).
- Netralisasi sel CSV (`=`, `+`, `-`, `@`, tab, CR), parser dan validator baris impor.
- Pembangkit password sementara.

### B2. Audit log dan pola transaksi
- Helper tunggal `writeAudit(tx, …)` dan pembungkus `withAudit`. Tidak ada kode yang mengubah atau menghapus baris `audit_logs`.
- Endpoint baca audit log (filter jenis data, aksi, pelaku, tanggal; admin dan manager).

### B3. Autentikasi dan hak akses
- Login email + password (bcrypt), hanya akun aktif, JWT, `GET /api/me`, logout, log `LOGIN`/`LOGIN_FAILED`.
- Pembatasan percobaan login (rate limit).
- Middleware peran (ADMIN, MANAGER, AGENT) dan guard "milik sendiri".
- Frontend: auth store, guard rute per peran, pengalihan setelah login, penghapusan kode sementara (`?as=`, `stores/session.ts`, `?preview=galat`, galeri).
- **Layar yang hidup:** Login.

### B4. Akun dan master data
- Akun: daftar, tambah (admin), ubah, nonaktifkan, reset password (password sementara). Manager hanya boleh mengubah akun AGENT. Akun tidak dihapus.
- Jenjang dan paket: daftar, tambah, ubah nama, aktif/nonaktif; yang sudah dipakai tidak dihapus.
- Perubahan skema yang kemungkinan perlu: kolom `users.last_login_at` (kolom "Login terakhir" di layar Akun) lewat `002_*.sql`.
- **Layar yang hidup:** Akun (admin), Master data, Akun agent (manager), Audit log.

### B5. Sekolah dan kontrak
- Sekolah: daftar + filter + pagination, detail, tambah (kontrak pertama wajib, NPSN unik, ID LMS opsional dan unik), ubah.
- Kontrak: catat perpanjangan (validasi periode), riwayat kontrak, retention per kontrak dari modul B1.
- Tab Riwayat perubahan sekolah = pembacaan audit log per entitas.
- **Layar yang hidup:** Sekolah (daftar, tambah, halaman sekolah, dialog Perpanjangan).

### B6. Penugasan dan target retention
- Tugaskan/pindahkan sekolah dalam satu transaksi (tutup baris lama, buat baris baru), batas `MAX_AGENTS_PER_SCHOOL`, total `share_percent` 100, riwayat penugasan.
- Target retention per tahun (default 65).
- **Layar yang hidup:** Penugasan, Target retention.

### B7. Check-in, check-out, dan foto
- Check-in: jam dari server, koordinat dan akurasi GPS, foto wajib (unggah, kompres di klien), satu kunjungan ONGOING per agent ditegakkan di transaksi, zona agent disalin ke kunjungan.
- Check-out: laporan wajib, menutup kunjungan.
- Foto di `PHOTO_STORAGE_DIR` (di luar `public/`), disajikan lewat rute yang mengecek peran dan kepemilikan.
- Rekap, detail kunjungan, riwayat agent, Beranda agent, Sekolah saya.
- **Layar yang hidup:** seluruh alur Agent HP, Rekap dan Detail kunjungan (manager).

### B8. Dashboard (manager dan agent)
- Satu endpoint agregat per bagian: statistik periode dengan perbandingan, deret grafik, kontribusi dan peringkat agent, kontrak perlu perhatian, sekolah belum dikunjungi, tabel kunjungan periode.
- Semua batas periode dari modul B1; query agregat diuji dengan seed yang memuat A dan B.
- **Layar yang hidup:** Dashboard manager, Beranda agent (bagian retention dan periode).

### B9. Impor dan ekspor CSV
- Impor: unggah, pratinjau baris valid/gagal (tanpa menyimpan), simpan (NPSN yang ada diperbarui, bukan diduplikasi; sekolah baru membawa kontrak pertama; jenjang/paket dicocokkan nama), `IMPORT` per baris di audit log, template unduhan.
- Ekspor: sekolah (+ kontrak berjalan), riwayat kontrak + retention, rekap kunjungan; filter aktif; UTF-8 BOM; netralisasi sel; `EXPORT` di audit log.
- **Layar yang hidup:** Impor & ekspor.

### B10. Penguatan dan rilis
- Audit keamanan (agent `security-auditor`): akses ID mudah ditebak, route foto, RBAC per endpoint, CSV injection, log tidak memuat data sensitif.
- Dockerfile produksi, `docker-compose.yml`, `scripts/deploy.sh`, uji di server internal. Skrip delta SQL `00N_*.sql` untuk setiap perubahan skema.
- Pembersihan sisa proyek lama di root repo.

## Strategi tes

| Jenis | Alat | Cakupan |
|---|---|---|
| Unit logika | Vitest (`backend/tests/unit/`) | Seluruh B1, tanpa database |
| Integrasi API | pytest + Playwright `APIRequestContext` (`tests/integration/`) | Tiap endpoint: peran yang boleh dan tidak boleh, validasi, audit log tertulis |
| E2E UI | pytest-playwright (`tests/e2e/`) | Alur kritis terhadap backend nyata dan seed khusus tes |
| Bug | tes gagal dulu, lalu perbaikan | semua |

Alur kritis yang wajib ada tesnya (dari CLAUDE.md): login, pembatasan peran, check-in, check-out, impor CSV, penugasan, perpanjangan, audit log, ekspor CSV, kontrak berjalan, target, periode WIB dashboard.

## Cara bekerja
- Satu tahap = satu branch `feat/api-<nama>` dari `chore/setup` (nanti dari `main` setelah ditinjau), commit kecil, `HANDOFF.md` diperbarui di akhir tahap.
- Tahap B1 dan B4–B6 aman dikerjakan sub-agent paralel di worktree terpisah (area file berbeda); B3 (auth), B7, dan B8 dikerjakan dari sesi utama karena menyentuh banyak bagian bersama.
- Dependency baru yang diusulkan (alasan): `zod` (validasi input tiap endpoint), `express-rate-limit` (batas percobaan login), `multer` (unggah foto dan CSV), parser CSV (impor). Dikonfirmasi satu per satu saat dipakai.

## Risiko
- **Rumus retention** adalah inti nilai produk: ditulis dan dites sebelum ada layar yang memakainya (B1).
- **Zona waktu dan batas hari WIB** mudah salah di SQL agregat: semua batas dihitung di modul B1 lalu diteruskan ke query sebagai rentang UTC.
- **Foto dan GPS** hanya jalan lewat HTTPS dan butuh uji di perangkat sungguhan sebelum rilis.
- **Beda perilaku UI tiruan dan API nyata** (mis. state hilang saat reload, loading, galat jaringan): UI tidak punya desain untuk keadaan memuat dan galat. Pola sederhana (indikator memuat, snackbar galat) dipakai konsisten, tanpa mengarang tata letak baru.
- **Skema:** model data revisi 8 mungkin kurang beberapa kolom yang dibutuhkan layar (mis. `last_login_at`). Setiap penambahan lewat skrip delta idempotent dan pembaruan `schema.prisma`.

## Keputusan (final, 14 November 2026)
1. **Token login: cookie httpOnly** (SameSite=Lax, plus pengecekan Origin sebagai perlindungan CSRF). Tidak memakai `localStorage`. Frontend memanggil API dengan `credentials: 'include'`; `CORS_ORIGIN` harus alamat frontend yang pasti.
2. **Ganti password saat login pertama: dihapus dari MVP.** Password hanya diatur admin lewat reset; layar Ganti password tidak dibuat. `must_change_password` dipertahankan di skema hanya sebagai penanda "akun baru atau baru direset" (chip "Wajib ganti password" di layar Akun tetap tampil). Konsekuensi dokumen: kalimat "wajib diganti saat login pertama" di `docs/PLAN.md` (bagian Akses) dan `CLAUDE.md` (Autentikasi) perlu disesuaikan, menunggu persetujuan user untuk mengubahnya.
3. **Database uji:** `sa_visit_tracker_test` terpisah di container MySQL lokal yang sama, dibuat ulang dari `001_init.sql` + seed tes sebelum tiap sesi tes.
4. **Urutan: logika murni dulu** (B0–B1), lalu B2 dan B3, dan seterusnya sesuai tahapan di atas.

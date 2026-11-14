# sa-visit-tracker

> Memori proyek untuk Claude Code. Jaga di bawah ±200 baris. Kalau ada detail panjang, taruh di `docs/` lalu tautkan ke sini, jangan disalin.

## Ringkasan
- Tujuan produk: agent service account (after sales LMS Skolla) melaporkan setiap kunjungan ke sekolah, manager memantau rekap harian dan laporan tiap agent, dan admin mengelola akun serta data sekolah klien.
- Pengguna: admin, manager service account, agent service account (mengisi laporan dari HP).
- Hak akses per peran: tabel Hak akses di `docs/PLAN.md`.
- Status: MVP, belum ada kode.
- Rencana dan daftar fitur MVP: `docs/PLAN.md`. Model data: `docs/data-model.md`. Arsitektur: `docs/architecture.md`. Tampilan: `docs/design-system.md`. Baca keempatnya di setiap sesi baru.

## Tech stack & arsitektur
- Frontend: Vue 3 + Vite (SPA) + Vuetify 3 + Pinia + Vue Router, disamakan dengan stack LMS Skolla. Grafik ApexCharts, ikon Material Design Icons (paket npm), font Rubik
- Backend: Express + TypeScript (strict) + Prisma 7 ke MySQL 8 (`utf8mb4`), auth JWT + bcrypt. Pola diambil dari spec aplikasi OKR, detailnya di `docs/architecture.md`
- Node.js 24 LTS (dikunci di `.nvmrc` dan `engines` di `package.json`). Vite 7, Prisma 7. Docker image `node:24-alpine`
- Package manager: npm
- Deploy: Docker di server internal Skolla
- Database: MySQL lewat Prisma. Model data di `docs/data-model.md`
- Autentikasi: email kantor + password. Akun hanya dibuat admin, dengan password sementara yang wajib diganti saat login pertama
- Penyimpanan foto: disk server, folder dari env `PHOTO_STORAGE_DIR`, di-mount sebagai volume Docker
- Struktur repo: `backend/` dan `frontend/`, lihat `docs/architecture.md`. Pembagian halaman frontend per peran:
  - Admin: akun, master jenjang dan paket, audit log
  - Manager: dashboard semua agent, rekap, detail kunjungan, data sekolah, kontrak, penugasan, target retention, impor dan ekspor CSV, akun agent, audit log
  - Agent: dashboard sendiri, check-in, check-out, Sekolah saya, riwayat sendiri
- Detail arsitektur: `docs/architecture.md`.
- `docs/PROJECT_ARCHITECTURE_SPEC.md` adalah spec aplikasi lain (Skolla BSC & OKR Suite). Pakai hanya pola yang sudah diambil di `docs/architecture.md`. JANGAN membangun fitur OKR, dan JANGAN mengikuti bagian yang berbeda: Nuxt, CSS scoped tanpa Vuetify, token warna OKR, Chart.js, Node 20, Prisma 5, ID UUID.

## Perintah
- Install: `npm install` di `backend/` dan di `frontend/`
- Jalankan dev: `npm run dev` di `backend/` dan di `frontend/` (dua terminal)
- Prisma Client: `npx prisma generate` di `backend/`
- Ubah database lokal: `npx prisma migrate dev` di `backend/` (HANYA lokal)
- Ubah database produksi: skrip SQL delta di `backend/sql/deltas/`, dijalankan manual lewat DBeaver. Lihat `docs/architecture.md`
- Tes unit: `npx vitest run` di `backend/` atau `frontend/`
- Tes E2E (Python): `pytest tests/e2e` (setelah `pip install -r tests/requirements.txt` dan `playwright install`)
- Jalankan semua lewat Docker: `docker compose up --build -d`
- Lint/format: _isi setelah stack dipasang_

## Aturan database
- DILARANG `prisma migrate` dan `prisma db push` di database produksi. Perubahan produksi lewat skrip SQL delta idempotent bernomor di `backend/sql/deltas/`, dan `schema.prisma` diperbarui bersamaan.
- Setiap tabel memakai primary key `INT AUTO_INCREMENT` dengan nama kolom `<entitas>_id`. Spesifikasi lengkap di `docs/data-model.md`.
- Nama tabel dan kolom di MySQL snake_case (`@@map`, `@map`). Di kode TypeScript tetap camelCase.
- Akun tidak dihapus, cukup dinonaktifkan (`is_active = false`).
- NPSN unik. Impor sekolah dengan NPSN yang sudah ada memperbarui baris lama.
- `schools.lms_school_id` adalah penghubung ke LMS Skolla, boleh kosong, unik jika diisi. Tidak ada foreign key constraint karena LMS ada di database lain.
- Jenjang dan paket memakai tabel master. Data master yang sudah dipakai dinonaktifkan, tidak dihapus.
- Penugasan sekolah di `school_assignments`, banyak-ke-banyak. Penugasan aktif = `unassigned_at` kosong. Jumlah agent aktif per sekolah dibatasi konstanta `MAX_AGENTS_PER_SCHOOL` (MVP: 1). Pindah agent = tutup baris lama, buat baris baru, dalam satu transaksi. Total `share_percent` agent aktif per sekolah = 100.
- Kontrak di `school_contracts`, satu baris per kontrak. Tanggal mulai dan berakhir diisi manual sesuai dokumen kontrak; durasi bisa berbeda. Validasi: berakhir > mulai, dan periode kontrak satu sekolah tidak tumpang tindih.
- `contract_value` berlaku penuh untuk seluruh durasi kontrak. JANGAN memprorata per bulan, minggu, atau hari.
- Kontrak berjalan = `contract_start_date` ≤ hari ini (WIB) ≤ `contract_end_date`. Jangan menambah kolom status untuk ini.
- Perpanjangan = kontrak `RENEWAL` dengan `previous_contract_id` ke kontrak milik sekolah yang sama dan `signed_date` wajib diisi. Satu kontrak paling banyak punya satu perpanjangan.
- Retention dan target: ikuti bagian "Retention dan target" di `docs/PLAN.md` persis, termasuk contoh sekolah A dan B yang wajib jadi tes Vitest. Ringkasnya: kohort tahun T = kontrak yang `contract_end_date`-nya di tahun T (kalender, WIB); retention = nilai perpanjangan yang sudah ditandatangani ÷ nilai kontrak kohort, tidak dibatasi 100%; target = `retention_targets.target_percent` (default 65) tahun itu. Berlaku untuk agregat manager dan per agent (sekolah yang ditugaskan × `share_percent`). Label status dua tingkat (Sesuai target / Di bawah target) dari kontrak yang sudah diputuskan. Retention sekolah ikut agent yang sedang ditugaskan. Semua rumus ini di satu modul service backend.
- Revenue transaksi atau pembayaran termin BUKAN bagian MVP. Jangan membuat tabel atau layar pencatatan revenue.
- Setiap perubahan data transaksi menulis `audit_logs` di transaksi database yang sama, lewat satu helper di layer service backend. Tidak ada kode yang mengubah atau menghapus baris `audit_logs`.

## Aturan domain
- Ada tiga peran: ADMIN, MANAGER, AGENT. Hak akses dicek di backend pada setiap endpoint. Menyembunyikan menu di frontend bukan pengaman.
- Hanya email terdaftar dan aktif yang bisa login.
- Hanya ADMIN yang membuat akun. MANAGER hanya boleh mengubah akun berperan AGENT, tetapi boleh mengubah data sekolah, mencatat kontrak dan perpanjangan, menugaskan sekolah, mengatur persentase target retention, impor dan ekspor CSV, serta melihat seluruh audit log. AGENT tidak bisa impor, ekspor, atau melihat audit log.
- Penugasan sekolah tidak wajib. Agent tetap boleh check-in di sekolah yang tidak ditugaskan kepadanya.
- Jam check-in dan check-out diambil dari waktu server, bukan dari jam HP agent.
- Zona waktu hanya WIB, WITA, WIT (enum), dipetakan ke Asia/Jakarta, Asia/Makassar, Asia/Jayapura. Semua konversi lewat satu helper bersama.
- Simpan waktu dalam UTC.
- Tanggal dan hari di rekap, serta periode dashboard (hari, minggu Senin–Minggu, bulan kalender), dihitung dalam WIB.
- Jam check-in dan check-out ditampilkan dalam zona agent (disalin ke `visits.timezone` saat check-in), dengan label zona.
- Lokasi GPS diambil lewat Geolocation API browser. API ini hanya jalan di HTTPS atau localhost.
- Satu kunjungan = satu agent + satu sekolah + satu check-in. Check-out menutup kunjungan dan wajib menyertakan laporan teks.
- Satu agent hanya boleh punya satu kunjungan ONGOING. Tegakkan di service dalam transaksi.

## Tampilan
- Semua warna, radius, spasi, dan tipografi dari `docs/design-system.md` (sumber: `docs/design-system/skolla-lms/`), dipasang sebagai tema dan `defaults` Vuetify. Jangan memakai warna palet Vuetify (`blue`, `red-darken-2`, `text-orange`, dan seterusnya) atau palet bawaan ApexCharts.
- Nilai warna tema Vuetify diambil dari `docs/design-system/skolla-lms/tokens.json`, bukan dari variabel Figma. Sebagian variabel warna di Figma masih nilai sementara (bertanda * di halaman `00 Fondasi & Komponen`), jadi perbedaan warna dengan Figma itu wajar; tokens.json yang benar.
- `color="primary"` = `brand` `#040abe`. Tema Vuetify wajib diisi token sejak awal; jangan ulangi temuan audit LMS yang membiarkan `primary` bawaan.
- Locale Vuetify Bahasa Indonesia, termasuk footer `VDataTable`.
- Teks berwarna memakai token `-text`, tidak pernah `-solid`.
- Kartu berborder tanpa bayangan (`flat` + `border`). Tombol pill. Input 42px.
- Susunan layar mengikuti desain final di Figma (lihat bagian "Membangun layar dari Figma"). Halaman yang belum ada di Figma memakai `docs/design-system/skolla-lms/pola-halaman.md`. Jangan mengarang susunan sendiri kalau desainnya sudah ada.
- Kenaikan dan penurunan angka selalu disertai ikon panah dan tanda + atau −, bukan warna saja.
- Format rupiah, persen, tanggal, dan durasi lewat helper bersama dengan locale `id-ID`.

## Membangun layar dari Figma
- Desain final: https://www.figma.com/design/vRVwtJvisOBQ0mc1OhkJ1u/SA. Halaman per peran: `01 Umum`, `02 Agent (HP)`, `03 Manager`, `04 Sekolah & Kontrak`, `05 Admin`. Komponen dan token ada di `00 Fondasi & Komponen`.
- Bangun setiap layar dari frame Figma-nya lewat Figma MCP (`get_design_context` dan `get_screenshot`). Kalau user tidak memberi link frame, cari frame berdasarkan namanya di halaman peran yang sesuai.
- Kode yang dihasilkan Figma hanya referensi. JANGAN menyalin kelas CSS, Tailwind, atau markup React-nya ke kode Vue; terjemahkan ke komponen Vuetify, `defaults`, dan token tema.
- Lebar acuan: desktop 1440px, HP 390px.
- Data seed untuk layar itu dibuat sama dengan isi frame (nama, angka, tanggal), supaya perbandingan visual adil.
- Setelah layar selesai: ambil screenshot frame Figma dan halaman Vue (Playwright) di lebar yang sama, simpan keduanya beserta gambar selisihnya di `tests/e2e/visual/`, perbaiki bagian yang meleset, lalu tunjukkan ketiga gambar ke user. Selisih warna karena token sementara di Figma tidak perlu dikejar.
- Kalau frame Figma bertentangan dengan `docs/PLAN.md` atau aturan di file ini, ikuti PLAN.md dan sebutkan selisihnya ke user.

## Konvensi kode
- Satu file satu tanggung jawab. File yang sudah ratusan baris dipecah.
- Penamaan: camelCase untuk fungsi dan variabel, PascalCase untuk komponen dan tipe, kebab-case untuk nama file non-komponen.
- Error ditangani di layer service, bukan di komponen UI.
- Validasi input di backend untuk setiap endpoint, walaupun frontend sudah memvalidasi.
- Teks UI dalam Bahasa Indonesia.

## Testing
- Tes E2E dan integrasi ditulis dalam **Python** dengan Playwright (`pytest-playwright`) di `tests/e2e/` dan `tests/integration/`. Tes API memakai `APIRequestContext` Playwright, jadi tidak perlu pustaka HTTP tambahan.
- Logika murni TypeScript (kontrak berjalan, kohort tahunan, retention, target, status, konversi zona waktu, periode dashboard WIB, format angka, netralisasi CSV) dites dengan **Vitest** di `backend/tests/unit/` dan `frontend/tests/unit/`. Pakai Vitest 3.2 atau lebih baru, karena versi itu yang mendukung Vite 7. Tes unit tidak menyentuh database.
- Setiap fitur baru datang bersama tesnya.
- Bug diperbaiki dengan menulis tes yang gagal dulu.
- Alur kritis (login, pembatasan peran, check-in, check-out, impor CSV, penugasan, pencatatan perpanjangan, penulisan audit log, ekspor CSV, perhitungan kontrak berjalan, perpanjangan, dan target, perhitungan periode WIB di dashboard) wajib punya tes E2E atau integrasi.
- Data uji dibuat lewat seed khusus tes, bukan data produksi.

## Git workflow
- Branch: `feat/<nama>`, `fix/<nama>`, `chore/<nama>`
- Commit kecil setelah setiap tugas yang lolos tes. Format: `feat(scope): deskripsi`
- Jangan push ke `main` tanpa review.

## Keamanan
- Rahasia hanya di `.env` (tidak di-commit). Contoh variabel ada di `backend/.env.example` dan `frontend/.env.example`, dengan nilai palsu. Jangan pernah menyalin nilai `JWT_SECRET` dari dokumen lain, termasuk dari spec OKR.
- Jangan pernah menulis API key, password, atau token di file ini.
- ID auto increment mudah ditebak. Setiap halaman detail dan route foto wajib mengecek hak akses pemanggil.
- Password disimpan sebagai hash (bcrypt atau argon2), tidak pernah teks biasa.
- Ekspor CSV menetralkan sel yang diawali `=`, `+`, `-`, `@`, tab, atau carriage return (CSV injection), dan setiap ekspor dicatat di `audit_logs` sebagai EXPORT.
- Log aplikasi ditulis ke stdout dalam JSON satu baris. Jangan pernah mencatat password, token, isi foto, atau koordinat GPS lengkap di log aplikasi.
- Nilai kontrak dan retention terlihat oleh ADMIN dan MANAGER untuk semua sekolah, dan oleh AGENT hanya untuk sekolah yang ditugaskan kepadanya.
- Foto kunjungan, koordinat GPS, dan nilai kontrak sekolah termasuk data sensitif. Folder foto berada di luar `public/` dan tidak di-commit.

## Jangan lakukan
- Jangan menambah dependency baru tanpa menyebutkan alasannya.
- Jangan mengubah file di `docs/` tanpa diminta, kecuali mencentang progres di `docs/PLAN.md`.
- Jangan mengerjakan fitur di luar daftar MVP sebelum MVP selesai.
- Jika memakai Prisma, jangan memakai contoh konfigurasi lama dari ingatan. Prisma 7 memindahkan URL koneksi ke `prisma.config.ts`; cek dokumentasi versi yang terpasang.

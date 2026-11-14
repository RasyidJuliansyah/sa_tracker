# SA Visit Tracker

Status: draf revisi 14. Siap mulai coding.

## Masalah

Laporan kunjungan agent service account ke sekolah pelanggan LMS Skolla belum tercatat di satu tempat. Manager jadi sulit memastikan siapa berkunjung ke sekolah mana, jam berapa, berapa lama, dan apa hasilnya.

## Pengguna

**Admin.** Satu-satunya peran yang membuat akun. Admin mengatur peran dan zona waktu pengguna, mengelola master jenjang dan paket, mengelola data sekolah klien Skolla Edtech (input satu per satu atau impor CSV) beserta kontraknya, menugaskan sekolah ke agent, mengatur persentase target retention, dan melihat audit log.

**Manager service account.** Memantau dashboard aktivitas dan retention semua agent, membuka laporan per kunjungan, mengubah data sekolah, mencatat kontrak dan perpanjangan, menugaskan sekolah, mengatur persentase target retention, mengimpor dan mengekspor CSV, mengubah akun agent, dan melihat audit log.

**Agent service account.** Melakukan check-in dan check-out dari HP saat berkunjung ke sekolah, memantau dashboard aktivitas dan retention-nya sendiri, dan melihat laporan serta kontrak sekolah yang ditugaskan kepadanya.

## MVP (versi pertama)

### Akses
- [ ] **Login dengan email kantor dan password.** Hanya email yang didaftarkan admin dan berstatus aktif yang bisa masuk. Akun baru mendapat password sementara dari admin. Tidak ada layar ganti password di MVP: password hanya diatur ulang oleh admin.
- [ ] **Pembatasan per peran.** Dicek di server, bukan hanya dengan menyembunyikan menu. Ringkasan hak akses ada di bagian Hak akses.

### Halaman admin
- [ ] **Kelola akun.** Tambah akun (nama, email kantor, peran, zona waktu, password sementara), ubah peran, reset password, dan nonaktifkan akun. Akun tidak dihapus supaya riwayat kunjungannya tetap utuh.
- [ ] **Master jenjang dan paket.** Tambah, ubah, dan nonaktifkan. Jenjang atau paket yang sudah dipakai sekolah tidak bisa dihapus.
- [ ] **Kelola data sekolah** (admin dan manager). Field: school_id (otomatis), ID LMS Skolla (angka, boleh kosong), NPSN, nama, jenjang, paket, zona waktu, tanggal mulai kerja sama, tanggal onboarding, tanggal aktif menggunakan, tanggal berakhir, alamat, kota, PIC, dan kontak PIC. NPSN tidak boleh ganda. Sekolah baru wajib diisi kontrak pertamanya.
- [ ] **Kontrak dan perpanjangan** (admin dan manager). Setiap kontrak berisi tanggal tanda tangan klien, tanggal mulai, tanggal berakhir, nilai kontrak, dan catatan. Tanggal mulai dan berakhir diisi manual sesuai dokumen kontrak, sehingga durasinya bisa berbeda. Perpanjangan dicatat sebagai kontrak baru yang menunjuk kontrak yang diperpanjangnya, dan wajib punya tanggal tanda tangan. Periode kontrak dalam satu sekolah tidak boleh tumpang tindih.
- [ ] **Impor CSV data sekolah** (admin dan manager). Pratinjau baris valid dan gagal sebelum disimpan. NPSN yang sudah ada diperbarui, bukan diduplikasi. Jenjang dan paket dicocokkan dengan nama di tabel master. Untuk sekolah baru, CSV juga membawa kontrak pertamanya: tanggal tanda tangan, tanggal mulai, tanggal berakhir, dan nilai kontrak. Perpanjangan tidak lewat impor, tetapi lewat layar kontrak. Template CSV bisa diunduh dari halaman impor.

### Ekspor CSV (admin dan manager)
- [ ] **Ekspor data ke CSV** dengan filter yang sedang aktif: data sekolah (termasuk kontrak berjalan dan status perpanjangannya), riwayat kontrak beserta retention-nya, dan rekap kunjungan. Setiap ekspor tercatat di audit log.

### Penugasan dan target retention (admin dan manager)
- [ ] **Tugaskan sekolah ke agent.** Penugasan tidak wajib: sekolah boleh tanpa agent, dan agent tetap bisa check-in di sekolah yang tidak ditugaskan kepadanya. Satu agent boleh memegang banyak sekolah. Untuk MVP satu sekolah dipegang paling banyak satu agent, tetapi data dan layarnya disiapkan untuk lebih dari satu (batasnya satu konstanta). Saat dipindah ke agent lain, riwayat penugasan lama tetap tersimpan.
- [ ] **Daftar sekolah per agent dan sekolah tanpa agent**, supaya manager bisa melihat sekolah mana yang belum ada penanggung jawabnya.
- [ ] **Persentase target retention per tahun.** Default 65%. Admin dan manager bisa mengubahnya untuk tahun tertentu. Aturan hitungnya di bagian Retention dan target.

### Audit log (admin dan manager)
- [ ] **Riwayat perubahan.** Setiap perubahan data transaksi (akun, sekolah, kontrak, penugasan, target retention, master data, check-in, check-out), setiap impor dan ekspor CSV, serta setiap login tercatat dengan pelaku, waktu, nilai sebelum dan sesudah. Bisa difilter per jenis data, pelaku, dan tanggal. Di halaman sekolah ada tab Riwayat perubahan untuk sekolah itu.

### Halaman manager
- [ ] **Dashboard aktivitas agent.** Lihat bagian Dashboard.
- [ ] **Kelola akun agent.** Mengubah data akun berperan agent (nama, zona waktu, status aktif). Membuat akun baru tetap hanya oleh admin.
- [ ] **Rekap kunjungan.** Tabel berisi tanggal, hari, nama agent, sekolah, jam check-in, jam check-out, durasi, dan status. Bisa difilter per tanggal, agent, dan sekolah.
- [ ] **Detail kunjungan.** Foto, laporan, dan lokasi check-in dalam bentuk tautan ke Google Maps.
- [ ] **Halaman sekolah.** Data sekolah, empat tanggal kerja sama, kontrak berjalan (periode, nilai kontrak, status perpanjangan), riwayat kontrak beserta retention setiap perpanjangan, agent yang ditugaskan, dan riwayat kunjungan terbaru di atas.

### Halaman agent
- [ ] **Dashboard aktivitas sendiri.** Lihat bagian Dashboard.
- [ ] **Check-in.** Agent memilih sekolah (sekolah yang ditugaskan kepadanya tampil paling atas), mengambil foto, lalu menekan Check-in. Sistem mencatat jam dari server serta koordinat GPS dan akurasinya. Check-in tanpa foto atau tanpa izin lokasi ditolak dengan pesan yang jelas.
- [ ] **Check-out dengan laporan.** Agent menulis laporan teks bebas tentang hasil kunjungan dan kondisi sekolah, lalu menekan Check-out. Check-out tanpa laporan ditolak.
- [ ] **Sekolah saya.** Daftar sekolah yang ditugaskan kepada agent. Setiap sekolah menampilkan data sekolah, kontrak berjalan dan status perpanjangannya, riwayat kontrak beserta retention-nya, serta semua laporan kunjungan agent itu ke sekolah tersebut.
- [ ] **Riwayat kunjungan sendiri.** Semua kunjungan agent itu, termasuk ke sekolah yang tidak ditugaskan kepadanya, terbaru di atas.

## Dashboard

Manager melihat dashboard untuk semua agent, dengan pilihan satu atau beberapa agent. Agent melihat dashboard yang sama, tetapi hanya berisi datanya sendiri. Susunan layarnya mengikuti mockup di `docs/references/mockups/` (dashboard manager: `manager-dashboard.md`); warna dan komponennya dari design system Skolla.

**Pilihan periode:** Hari, Minggu, Bulan, dengan tombol periode sebelumnya dan berikutnya. Periode dihitung dalam WIB. Minggu berjalan dari Senin sampai Minggu, bulan mengikuti bulan kalender. Setiap angka dibandingkan dengan periode sebelumnya.

**Isi yang tidak ikut pilihan periode (tahunan):**
- Retention tahun berjalan: nilai perpanjangan yang sudah ditandatangani dibanding target, persentase retention, progress bar, dan label status (lihat bagian Retention dan target)
- Daftar kontrak yang sudah berakhir tahun ini tetapi belum diperpanjang, dan kontrak yang akan berakhir dalam waktu dekat

**Isi per periode:**
- Nilai perpanjangan yang ditandatangani pada periode itu, dengan perubahan dibanding periode sebelumnya
- Jumlah kunjungan selesai dan kunjungan yang masih berlangsung
- Jumlah sekolah berbeda yang dikunjungi
- Total dan rata-rata durasi kunjungan
- Kunjungan ke sekolah yang ditugaskan dibanding ke sekolah lain
- Sekolah yang ditugaskan tetapi belum dikunjungi pada periode itu
- Grafik: per jam untuk Hari, per hari untuk Minggu dan Bulan, dengan tab Perpanjangan, Kunjungan, Durasi
- Untuk manager: bar kontribusi retention per agent dan daftar kartu peringkat agent (urut persentase retention), dengan kartu yang bisa dibuka untuk melihat rincian agent
- Daftar kunjungan pada periode itu, terbaru di atas

## Hak akses

| Hal | Admin | Manager | Agent |
|---|---|---|---|
| Membuat akun | Ya | Tidak | Tidak |
| Mengubah akun | Semua | Agent saja | Tidak |
| Master jenjang dan paket | Ya | Tidak | Tidak |
| Impor CSV sekolah | Ya | Ya | Tidak |
| Ekspor CSV | Ya | Ya | Tidak |
| Mengubah data sekolah | Ya | Ya | Tidak |
| Melihat data sekolah | Semua | Semua | Semua, untuk check-in |
| Mencatat kontrak dan perpanjangan | Ya | Ya | Tidak |
| Melihat nilai kontrak dan retention | Semua sekolah | Semua sekolah | Sekolah yang ditugaskan kepadanya |
| Menugaskan sekolah | Ya | Ya | Tidak |
| Mengatur persentase target retention | Ya | Ya | Tidak |
| Dashboard | Semua agent | Semua agent | Diri sendiri |
| Laporan kunjungan dan foto | Semua | Semua | Milik sendiri |
| Audit log (perubahan data, impor, ekspor, login) | Semua | Semua | Tidak |

Baris yang belum pernah dibahas dan aku isi sendiri: persentase target retention bisa diatur admin dan manager, dan agent tidak bisa mengekspor.

## Aturan zona waktu

- Zona waktu yang dipakai hanya WIB, WITA, dan WIT. Setiap akun dan setiap sekolah punya zona waktu yang diatur admin.
- Waktu disimpan dalam UTC di database.
- Tanggal dan hari di rekap, serta periode di dashboard, mengikuti WIB.
- Jam check-in dan check-out ditampilkan dalam zona waktu agent yang berkunjung, dengan labelnya, misalnya 09.15 WITA. Zona agent disalin ke data kunjungan saat check-in.

## Retention dan target

Aturan ini disusun dari penjelasan user pada 14 November 2026, dengan contoh angka yang sudah dikonfirmasi.

- **Nilai kontrak** adalah dasar semua hitungan. Pembayaran termin belum dipakai di MVP (lihat Fase 2).
- **Retention satu kontrak** = nilai kontrak perpanjangannya ÷ nilai kontrak itu. Dihitung sejak perpanjangan ditandatangani klien, bukan saat kontrak lama berakhir. Tidak dibatasi 100%: klien yang memperpanjang dengan nilai lebih besar menghasilkan retention di atas 100%. Selama belum ada perpanjangan yang ditandatangani, nilai yang ter-retain 0.
- **Dasar tahunan (kohort):** untuk tahun T, yang dihitung hanya kontrak yang tanggal berakhirnya jatuh di tahun T. Tahun mengikuti kalender, 1 Januari sampai 31 Desember, menurut WIB (dikonfirmasi user). Perpanjangan yang ditandatangani lebih awal (misalnya Desember tahun sebelumnya) tetap dihitung untuk kohort kontrak yang diperpanjangnya.
- **Target manager tahun T** = persentase target (default 65%) × total nilai kontrak di kohort T.
- **Retention manager tahun T** = total nilai perpanjangan yang sudah ditandatangani untuk kontrak di kohort T ÷ total nilai kontrak kohort T. Tercapai jika ≥ persentase target.
- **Retention agent** dihitung dengan cara yang sama dari kontrak kohort T milik sekolah yang sedang ditugaskan kepadanya (dikali porsi penugasan), lalu dibandingkan dengan persentase target yang sama. Jika sekolah dipindah ke agent lain, seluruh retention sekolah itu ikut ke agent baru, termasuk perpanjangan yang ditandatangani sebelum pemindahan.
- **Contoh terkonfirmasi.** Sekolah A, kontrak Rp 80 jt, agent C, diperpanjang Rp 80 jt. Sekolah B, kontrak Rp 20 jt, agent D, diperpanjang Rp 10 jt. Hasilnya agent C 100% (tercapai), agent D 50% (belum tercapai), manager Rp 90 jt dari target minimal Rp 65 jt, atau 90% (tercapai).
- **Label status berdasarkan capaian tahun berjalan.** Di tengah tahun, sebagian kontrak kohort belum jatuh tempo, sehingga retention tahunan wajar masih rendah. Karena itu status dihitung dari kontrak yang sudah "diputuskan": sudah diperpanjang, atau sudah lewat tanggal berakhirnya. Status "Sesuai target" jika retention kontrak yang sudah diputuskan ≥ persentase target, "Di bawah target" jika kurang, dan "Belum ada data" jika belum ada kontrak yang diputuskan.
- Di dashboard, pilihan Hari, Minggu, Bulan tidak mengubah angka retention tahunan dan statusnya.
- Agent melihat nilai kontrak dan retention sekolah yang ditugaskan kepadanya.

## Penyimpanan foto

- Foto disimpan di disk server, di folder yang diatur lewat `PHOTO_STORAGE_DIR`, di luar folder `public/`. Di Docker, folder ini adalah volume yang di-mount dari server.
- Foto hanya bisa dibuka lewat route yang mengecek login dan peran.
- Foto dikompres di sisi klien sebelum diunggah.

## Deploy

- Aplikasi dijalankan sebagai container Docker di server internal Skolla.
- Dua container (backend dan frontend) lewat Docker Compose, masing-masing multi-stage dari `node:24-alpine`, berjalan sebagai user non-root. Nginx di host meneruskan `/` ke frontend dan `/api` ke backend. Port 3010 (frontend) dan 3011 (backend), sudah dipastikan aman dengan tim internal. Detail di `docs/architecture.md`.
- Perubahan database produksi tidak memakai `prisma migrate` atau `db push`, melainkan skrip SQL delta idempotent yang dijalankan manual lewat DBeaver sebelum versi aplikasi baru dinyalakan. Prosedurnya di `docs/architecture.md`.
- Folder foto di-mount sebagai volume supaya tidak hilang saat container diganti, dan ikut di-backup.
- Rahasia (`DATABASE_URL`, `AUTH_SECRET`) diberikan lewat env file di server, tidak ikut ke dalam image.
- Akses dari luar kantor, domain, dan sertifikat HTTPS diurus tim internal Skolla. Syarat dari sisi aplikasi: harus dibuka lewat HTTPS, karena GPS dan kamera di browser tidak berjalan tanpanya.

## Log di produksi

Ada dua jenis log, dengan tugas berbeda:

- **Audit log** (tabel `audit_logs`): riwayat bisnis yang bisa dibuka admin dan manager dari aplikasi. Siapa mengubah apa, kapan, dan nilai sebelum serta sesudahnya.
- **Log aplikasi**: catatan teknis (request, galat, durasi query lambat) ditulis ke stdout dalam format JSON satu baris per kejadian, sehingga bisa dibaca lewat `docker logs` atau diteruskan ke sistem log tim internal. Log aplikasi tidak boleh memuat password, isi foto, token, atau koordinat GPS lengkap.

## Di luar cakupan MVP

- Mode offline untuk sekolah yang sinyalnya lemah
- Validasi jarak (geofence) antara lokasi check-in dan koordinat sekolah
- Jadwal atau rencana kunjungan dari manager
- Ekspor ke Excel (.xlsx) atau PDF (MVP: CSV)
- Notifikasi WhatsApp atau email, termasuk pengingat kerja sama yang akan berakhir
- Sinkronisasi otomatis dengan database LMS Skolla
- Lupa password lewat email (MVP: reset oleh admin)

## Fase berikutnya

### Fase 2
- Target jumlah kunjungan per agent
- Satu sekolah dipegang lebih dari satu agent (naikkan `MAX_AGENTS_PER_SCHOOL`, aktifkan pengaturan porsi di layar penugasan)
- Geofence: tandai kunjungan yang check-in-nya jauh dari koordinat sekolah
- Ekspor ke Excel (.xlsx)
- Pengingat sekolah yang tanggal berakhirnya sudah dekat
- **Penagihan pembayaran termin oleh SA** untuk membantu tim finance: pencatatan termin per kontrak, status pembayaran, dan pembatalan dengan alasan. Rancangan tabel transaksi revenue dari revisi sebelumnya bisa dipakai lagi di sini

### Fase 3
- Jadwal kunjungan per agent
- Sinkronisasi data sekolah dengan LMS Skolla lewat `lms_school_id`
- Ringkasan otomatis laporan mingguan per sekolah

## Tech stack

Disamakan dengan stack LMS Skolla yang sudah berjalan.

- Frontend: Vue 3 + Vite (SPA) + Vuetify 3 + Pinia + Vue Router
- Grafik: ApexCharts
- Ikon: Material Design Icons, dari paket npm
- Font: Rubik
- Backend: Express + TypeScript (strict), dengan pola dari aplikasi Skolla BSC & OKR Suite (`docs/architecture.md`)
- ORM: Prisma
- Database: MySQL. Semua primary key `INT AUTO_INCREMENT`
- Runtime: Node.js 24 LTS, dengan Vite 7 dan Prisma 7. Package manager npm
- Tes: Vitest untuk tes unit logika TypeScript, Python + Playwright (`pytest-playwright`) untuk E2E dan integrasi
- Autentikasi: email kantor + password, akun dibuat admin. JWT Bearer dan bcrypt
- Penyimpanan foto: disk server, volume Docker
- Hosting: server internal Skolla, deploy dengan Docker
- Alasan: menyamakan dengan LMS supaya tim developer Skolla bisa langsung merawatnya, dan design system Skolla LMS memang dibangun di atas Vuetify.

## Model data

Draf lengkap ada di `docs/data-model.md`, ditulis dalam sintaks Prisma. Tabelnya `users`, `jenjang`, `packages`, `schools`, `school_contracts`, `retention_targets`, `school_assignments`, `visits`, dan `audit_logs`, semuanya dengan primary key auto increment.

Karena ID berurutan mudah ditebak (`/visits/1`, `/visits/2`, dan seterusnya), setiap halaman detail dan route foto wajib mengecek hak akses.

## Catatan teknis

- Foto diambil dengan `<input type="file" accept="image/*" capture="environment">`, yang membuka kamera di browser HP. Perilaku `capture` belum diuji di semua browser HP, jadi perlu dicek di perangkat yang dipakai agent.
- Geolocation API browser hanya berjalan di HTTPS atau localhost. Saat tes di HP lewat jaringan lokal, perlu tunnel HTTPS.
- Jika memakai Prisma: Prisma 7 memindahkan URL koneksi ke `prisma.config.ts` dan memakai driver adapter. Lihat `docs/data-model.md`.
- Password disimpan sebagai hash dengan algoritma khusus password (misalnya bcrypt atau argon2), tidak pernah sebagai teks biasa.
- Ekspor CSV wajib menetralkan sel yang diawali `=`, `+`, `-`, `@`, tab, atau carriage return, supaya file tidak menjalankan rumus saat dibuka di Excel atau Google Sheets (CSV injection). File ditulis dalam UTF-8 dengan BOM supaya huruf tetap terbaca di Excel.

## Urutan kerja yang diusulkan

0. Pastikan `node -v` menunjukkan 24.
1. Buat `frontend/` dengan generator Vite (Vue + TypeScript) dan `backend/` dengan Express + TypeScript strict, mengikuti struktur di `docs/architecture.md`. Pasang Vuetify 3 dan Pinia, lalu isi tema, `defaults`, locale Indonesia, dan font Rubik sesuai `docs/design-system.md`. Siapkan Vitest di kedua folder, `tests/requirements.txt`, dan konfigurasi `pytest-playwright`.
2. Salin schema dari `docs/data-model.md` ke `backend/prisma/schema.prisma`, siapkan `prisma.config.ts`, jalankan `prisma migrate dev` di lokal, dan simpan SQL hasilnya sebagai `backend/sql/deltas/001_init.sql` yang idempotent untuk produksi. Lalu buat seed berisi satu admin, satu manager, tiga agent (WIB, WITA, WIT), beberapa jenjang dan paket, sekolah contoh dengan kontrak yang berakhir di tahun berjalan dan tahun depan, sebagian sudah diperpanjang dengan nilai lebih kecil, sama, dan lebih besar, penugasan, dan kunjungan contoh selama dua bulan, termasuk contoh sekolah A dan B di bagian Retention dan target supaya dashboard dan perbandingan periode bisa dites.
3. Helper audit log dan log aplikasi JSON, dipakai sejak fitur pertama.
4. Login, pembatasan akses per peran, dan log login (tanpa ganti password; reset oleh admin).
5. Kerangka layout dengan `VNavigationDrawer` dan `VAppBar`, ditambah komponen sendiri StatCard, EmptyState, dan chip perubahan angka sesuai `docs/design-system.md`.
6. Halaman admin: kelola akun.
7. Halaman admin: master jenjang dan paket.
8. Data sekolah, serta kontrak dan perpanjangan.
9. Impor CSV data sekolah beserta template CSV, dan ekspor CSV (sekolah, riwayat kontrak, rekap kunjungan).
10. Penugasan sekolah, persentase target retention, dan perhitungan retention (diuji dengan Vitest memakai contoh sekolah A dan B).
11. Alur check-in (pilih sekolah, foto, GPS) dan penyimpanan foto.
12. Alur check-out dengan laporan.
13. Rekap dan detail kunjungan.
14. Dashboard manager dan agent dengan periode hari, minggu, bulan, mengikuti mockup dashboard.
15. Halaman sekolah, Sekolah saya, riwayat agent, halaman audit log, dan pengubahan akun agent oleh manager.
16. Dockerfile produksi untuk `backend/` dan `frontend/`, `docker-compose.yml`, `scripts/deploy.sh`, dan uji coba di server internal.
17. Audit keamanan sebelum dipakai tim.

Setiap langkah ditutup dengan tes dan commit.

## Referensi

- Design system: `docs/design-system.md` dan sumbernya di `docs/design-system/skolla-lms/`
- Mockup UI buatan user: `docs/references/mockups/`

## Keputusan penting

- 2026-11-13: Stack Next.js + MySQL (Prisma) (stack frontend diganti 2026-11-14). Bukti kunjungan di MVP: jam check-in dan check-out otomatis, GPS saat check-in, foto, dan laporan teks bebas setelah kunjungan.
- 2026-11-13: Login memakai email kantor + password. Akun hanya dibuat oleh admin.
- 2026-11-13: Foto disimpan di server sendiri.
- 2026-11-13: Data sekolah bisa diisi manual oleh admin atau diimpor lewat CSV.
- 2026-11-13: Setiap primary key tabel memakai auto increment.
- 2026-11-13: ID LMS Skolla disimpan sebagai angka, boleh kosong.
- 2026-11-13: Jenjang dan paket diisi admin lewat tabel master.
- 2026-11-13: Empat tanggal kerja sama: mulai kerja sama, onboarding, aktif menggunakan, berakhir.
- 2026-11-13 (diganti 2026-11-14): Revenue ditampilkan kumulatif dan kerja sama berjalan, bisa diurutkan berdasarkan tanggal dan jam. Agent boleh melihat revenue.
- 2026-11-13: Sekolah punya zona waktu (WIB, WITA, WIT). Tanggal di rekap mengikuti WIB. Jam kunjungan ditampilkan dalam zona agent.
- 2026-11-13: UI memakai Tailwind CSS + shadcn/ui (diganti 2026-11-14). Deploy dengan Docker ke server internal Skolla.
- 2026-11-13: Dashboard aktivitas untuk manager (semua agent) dan agent (diri sendiri), periode hari, minggu, bulan.
- 2026-11-13: Admin dan manager bisa menugaskan sekolah ke agent, tidak wajib. Agent melihat laporannya sendiri per sekolah yang ditugaskan.
- 2026-11-13 (diganti 2026-11-14): Target revenue agent masuk MVP. Default-nya nilai retention kontrak berjalan sekolah yang ditugaskan.
- 2026-11-13: Satu sekolah sementara satu agent, tetapi data disiapkan untuk banyak-ke-banyak.
- 2026-11-13: Manager boleh mengubah data sekolah dan mencatat revenue. Semua perubahan data transaksi tercatat di audit log.
- 2026-11-13: Akses server dari luar kantor, domain, dan HTTPS diurus tim internal Skolla.
- 2026-11-13: Tampilan memakai design system Skolla LMS.
- 2026-11-13 (diganti 2026-11-14): Nilai kontrak retention dihitung penuh untuk periode kontrak 12 bulan, tidak diprorata.
- 2026-11-13: Manager bisa impor dan ekspor CSV. Audit log mencatat perubahan data, impor, ekspor, dan login, dan bisa dilihat admin serta manager.
- 2026-11-13 (diganti 2026-11-14): Tanggal mulai kontrak menjadi acuan retention. Perpanjangan dicatat sebagai kontrak baru, kontrak sebelumnya masuk riwayat.
- 2026-11-14: Stack diganti dari Next.js + React ke Vue 3 + Vuetify 3, disamakan dengan stack LMS Skolla. Tailwind dan shadcn/ui tidak dipakai.
- 2026-11-14: Susunan layar mengikuti mockup buatan user (gambar atau screenshot), menggantikan referensi Dribbble. Design system Skolla LMS tetap jadi dasar token.
- 2026-11-14: Frontend Vue 3 + Vite. Backend TypeScript + Prisma. Package manager npm. Tes dengan Python + Playwright.
- 2026-11-14: Pola arsitektur diambil dari spec Skolla BSC & OKR Suite: Express modular, JWT + bcrypt, Pinia, repo `backend/` dan `frontend/`, Docker Compose + Nginx, migrasi produksi lewat SQL delta manual. Frontend, UI, grafik, Node, Prisma, dan ID tetap mengikuti keputusan proyek ini.
- 2026-11-14: Node.js 24 LTS, dengan Vite 7 dan Prisma 7. Docker image `node:24-alpine`. Menggantikan Node 22, yang masa dukungannya berakhir 30 April 2027.
- 2026-11-14: Tes unit TypeScript dengan Vitest. Tes E2E dan integrasi dengan Python + Playwright.

- 2026-11-14: Dashboard manager memakai kartu peringkat agent seperti mockup, dan filter bisa memilih beberapa agent.
- 2026-11-14: Tanggal berakhir kontrak diisi manual sesuai dokumen kontrak; durasi bisa berbeda. Menggantikan aturan 12 bulan.
- 2026-11-14: Target retention = 65% dari nilai kontrak klien yang kontraknya berakhir di tahun itu. Retention = nilai perpanjangan ÷ nilai kontrak lama, dihitung sejak perpanjangan ditandatangani, tidak dibatasi 100%. Berlaku untuk manager (agregat) dan per agent. Menggantikan target berbasis revenue tercatat dan target manual per agent.
- 2026-11-14: Pencatatan revenue per transaksi dipindah ke Fase 2 sebagai penagihan termin.

- 2026-11-14: Port 3010 (frontend) dan 3011 (backend) dipastikan aman.
- 2026-11-14: Label status retention cukup dua tingkat (Sesuai target, Di bawah target) dari kontrak yang sudah diputuskan. Tingkat ketiga belum diperlukan.
- 2026-11-14: Kohort retention memakai tahun kalender, Januari sampai Desember (WIB).
- 2026-11-14: Retention sekolah dihitung ke agent yang sedang ditugaskan saat ini; jika sekolah dipindah, retention-nya ikut ke agent baru.

## Pertanyaan terbuka

Belum ada. Tambahkan di sini jika muncul saat coding.

---
artifact: prd
version: "1.0"
created: 2026-11-15
status: draft
---

# PRD: Rencana kunjungan dan izin kunjungan di luar tugas

Bagian dari MVP SA Visit Tracker, revisi 15 `docs/PLAN.md`. Ringkasannya ada di PLAN.md. Jika dokumen ini dan PLAN.md berbeda, PLAN.md yang berlaku.

## Ringkasan

### Masalah

Aturan MVP sebelumnya membolehkan agent check-in di sekolah mana pun, termasuk sekolah yang dipegang agent lain. Akibatnya:

- Manager baru tahu ada kunjungan setelah agent check-in. Tidak ada gambaran siapa akan ke sekolah mana minggu ini.
- Penugasan sekolah, yang menjadi dasar retention per agent, tidak membatasi siapa yang boleh berkunjung. Dua agent bisa mendatangi klien yang sama tanpa sepengetahuan manager.

Kenapa sekarang: aturan check-in lebih mudah ditetapkan sebelum rilis daripada ditutup setelah agent terbiasa check-in di mana saja. Keputusan pemilik produk, 15 November 2026: perubahan ini masuk MVP, dan rilis menunggu fitur ini.

### Solusi

Tiga perubahan yang dirilis bersama:

1. **Jadwal dari manager.** Manager dan admin membuat jadwal kunjungan untuk agent: sekolah, tanggal, dan tujuan. Jadwal dari manager langsung berlaku.
2. **Rencana buatan agent.** Agent membuat rencana kunjungannya sendiri di luar jadwal dari manager. Rencana ke sekolah yang ditugaskan kepadanya langsung terjadwal. Rencana ke sekolah lain menjadi pengajuan yang harus disetujui manager.
3. **Check-in dibatasi.** Agent hanya bisa check-in di sekolah yang sedang ditugaskan kepadanya, atau di sekolah lain yang punya rencana terjadwal untuk hari itu.

Persetujuan hanya memberi izin kunjungan untuk satu rencana itu. Penugasan sekolah dan retention tidak berubah.

### Pengguna

- **Agent:** membuat rencana, mengajukan kunjungan ke sekolah lain, melihat jadwal dari manager, check-in sesuai izin.
- **Manager:** membuat jadwal, menyetujui atau menolak pengajuan, memantau rencana dan realisasinya.
- **Admin:** hak yang sama dengan manager untuk jadwal dan persetujuan (asumsi, lihat Pertanyaan terbuka).

## Tujuan dan ukuran keberhasilan

### Tujuan

1. Tidak ada kunjungan ke sekolah di luar tugas tanpa izin manager.
2. Manager melihat rencana kunjungan sebelum kunjungan terjadi.
3. Agent tetap bisa merencanakan kunjungan ke sekolahnya sendiri tanpa menunggu manager.

### Ukuran keberhasilan

Aplikasi belum dirilis, jadi belum ada baseline. Angka target bertanda *usulan* belum disepakati; tetapkan setelah 4 minggu data. Semua ukuran dihitung dari tabel `visit_plans` dan `visits`, tanpa event tracking tambahan.

| Ukuran | Definisi | Baseline | Target | Kapan |
|---|---|---|---|---|
| Kunjungan di luar tugas tanpa izin | Kunjungan di sekolah yang tidak ditugaskan ke agent itu dan tanpa rencana terjadwal | Tidak terukur (aturan lama mengizinkan) | 0, dijamin server | Sejak rilis |
| Rencana terlaksana | Rencana terjadwal yang punya kunjungan di tanggalnya ÷ semua rencana terjadwal yang tanggalnya sudah lewat | Belum ada | *Usulan* ≥ 80% | 4 minggu setelah rilis |
| Waktu keputusan pengajuan | Median waktu dari pengajuan dibuat sampai disetujui atau ditolak | Belum ada | *Usulan* < 1 hari kerja | 4 minggu setelah rilis |
| Pengajuan kedaluwarsa | Pengajuan yang lewat tanggalnya tanpa keputusan ÷ semua pengajuan | Belum ada | *Usulan* ≤ 10% | 4 minggu setelah rilis |
| Kunjungan terencana | Kunjungan yang terhubung ke rencana ÷ semua kunjungan | Belum ada | Dipantau, tanpa target | Sejak rilis |

### Bukan tujuan

- Mengubah penugasan atau retention lewat persetujuan kunjungan.
- Mengajukan sekolah baru yang belum ada di data sekolah (misalnya calon klien). Sekolah baru tetap ditambahkan admin atau manager.
- Optimasi rute atau tampilan kalender.
- Notifikasi WhatsApp atau email (tetap di luar cakupan MVP).

## User story

| ID | Story | Prioritas |
|---|---|---|
| US-1 | Sebagai manager, saya ingin membuat jadwal kunjungan untuk agent supaya kunjungan penting ke sekolah tertentu dilakukan pada tanggalnya. | P0 |
| US-2 | Sebagai agent, saya ingin membuat rencana kunjungan ke sekolah yang saya pegang supaya minggu kerja saya tertata tanpa menunggu manager. | P0 |
| US-3 | Sebagai agent, saya ingin mengajukan kunjungan ke sekolah yang bukan tugas saya beserta alasannya, supaya kunjungan itu terjadi dengan sepengetahuan manager. | P0 |
| US-4 | Sebagai manager, saya ingin melihat profil sekolah, pemegangnya, dan alasan agent sebelum menyetujui atau menolak pengajuan. | P0 |
| US-5 | Sebagai manager, saya ingin check-in di sekolah di luar tugas ditolak tanpa izin, supaya kepemilikan sekolah jelas. | P0 |
| US-6 | Sebagai agent, saya ingin melihat rencana hari ini di Beranda dan langsung check-in dari situ. | P1 |
| US-7 | Sebagai manager, saya ingin melihat rencana yang terlaksana dan yang terlewat per agent di dashboard. | P1 |

Kriteria penerimaan per story ada di Peta verifikasi (bagian Kontrak eksekusi).

## Cakupan

### Termasuk

- Tabel rencana kunjungan, statusnya, dan hubungan rencana dengan kunjungan.
- Layar agent: Rencana (daftar dan buat), blok Rencana hari ini di Beranda, pemilih sekolah di Check-in yang dibatasi.
- Layar manager dan admin: Jadwal kunjungan (antrean persetujuan, semua rencana, buat jadwal, detail pengajuan).
- Pembatasan check-in di server.
- Angka pengajuan menunggu dan rencana terlaksana di dashboard.
- Audit log untuk setiap perubahan rencana.
- Tes unit untuk aturan izin check-in dan status rencana, tes database dan E2E untuk alur kritis.

### Tidak termasuk

- Pengajuan sekolah yang belum ada di data.
- Persetujuan yang mengubah penugasan.
- Jadwal berulang (misalnya setiap Senin).
- Mengubah rencana yang sudah dibuat. Cukup batalkan lalu buat lagi.
- Ekspor CSV rencana kunjungan.

### Nanti

- Jadwal berulang. Tunggu pola pemakaian jadwal manual dulu.
- Notifikasi pengajuan baru ke manager. Ikut keputusan notifikasi WhatsApp atau email.
- Pengajuan sekolah baru oleh agent. Butuh status sekolah calon klien dan aturan kontrak pertama yang berbeda.
- Ekspor rencana kunjungan ke CSV.

## Rancangan solusi

### Istilah

- **Rencana kunjungan:** satu agent, satu sekolah, satu tanggal (WIB), dan tujuan kunjungan.
- **Jadwal dari manager:** rencana yang dibuat manager atau admin untuk agent.
- **Rencana saya:** rencana yang dibuat agent untuk dirinya sendiri.
- **Pengajuan:** rencana saya ke sekolah yang tidak ditugaskan kepada agent itu. Butuh persetujuan.

### Status rencana

Disimpan di database: `PENDING` (Menunggu persetujuan), `APPROVED` (Terjadwal), `REJECTED` (Ditolak), `CANCELLED` (Dibatalkan).

Dihitung, tidak disimpan (sama seperti kontrak berjalan):

- **Selesai:** kunjungan yang terhubung ke rencana (`visits.plan_id`) sudah check-out, yaitu `visits.status = DONE`. Baru pada titik itu agent dianggap meninggalkan sekolah dan bisa menuju kunjungan berikutnya kalau ada.
- Selama kunjungan yang terhubung masih `ONGOING` (sudah check-in, belum check-out), rencana tetap tampil **Terjadwal**, bukan Selesai. Tidak ada status antara ("sedang berlangsung") khusus untuk rencana; tampilan "sedang berlangsung" dibaca dari kunjungan ONGOING itu sendiri (blok Kunjungan berlangsung di Beranda), bukan dari chip status rencana.
- **Terlewat:** Terjadwal, tanggalnya sudah lewat (WIB), tanpa kunjungan terhubung sama sekali (tidak ada `DONE` maupun `ONGOING`). Kalau ada kunjungan terhubung yang masih `ONGOING`, rencana tetap **Terjadwal** meski tanggalnya sudah lewat, lalu berubah ke **Selesai** saat kunjungan itu check-out. Rencana tidak pernah berpindah langsung ke Terlewat selama agent masih berada di lokasi.
- **Kedaluwarsa:** Menunggu persetujuan, tanggalnya sudah lewat tanpa keputusan.

Status awal saat rencana dibuat:

| Pembuat | Sekolah | Status awal |
|---|---|---|
| Manager atau admin | Sekolah mana pun | Terjadwal, pemutus = pembuat |
| Agent | Sekolah yang sedang ditugaskan kepadanya | Terjadwal, tanpa pemutus |
| Agent | Sekolah lain | Menunggu persetujuan |

### Kebutuhan fungsional

#### Membuat dan membatalkan rencana

- **FR-1:** Manager dan admin dapat membuat jadwal untuk satu agent aktif, dengan sekolah, tanggal, dan tujuan. Status awal Terjadwal.
- **FR-2:** Agent dapat membuat rencana untuk dirinya sendiri, dengan status awal sesuai tabel di atas. Agent tidak dapat membuat rencana untuk agent lain.
- **FR-3:** Tanggal rencana paling awal hari ini dan paling jauh 90 hari ke depan, dihitung dalam WIB.
- **FR-4:** Tujuan kunjungan wajib, 5 sampai 255 karakter.
- **FR-5:** Satu agent hanya boleh punya satu rencana aktif (Menunggu persetujuan atau Terjadwal) untuk sekolah dan tanggal yang sama. Ditegakkan di service, di dalam transaksi.
- **FR-6:** Agent dapat membatalkan rencana saya yang Menunggu persetujuan atau Terjadwal selama belum ada kunjungan. Agent tidak dapat membatalkan jadwal dari manager.
- **FR-7:** Manager dan admin dapat membatalkan rencana apa pun yang belum punya kunjungan. Rencana yang sudah punya kunjungan tidak bisa dibatalkan siapa pun.

#### Persetujuan

- **FR-8:** Manager dan admin melihat antrean pengajuan Menunggu persetujuan, urut dari tanggal rencana terdekat.
- **FR-9:** Detail pengajuan menampilkan agent pengaju, tanggal, tujuan, profil sekolah (nama, NPSN, jenjang, paket, kota, alamat, PIC), agent yang sedang memegang sekolah atau "Tanpa agent", kontrak berjalan, dan 5 kunjungan terakhir ke sekolah itu oleh agent mana pun.
- **FR-10:** Manager dan admin dapat menyetujui (catatan opsional) atau menolak (alasan wajib). Hanya pengajuan Menunggu persetujuan yang tanggalnya hari ini atau setelahnya yang bisa diputuskan. Pemutus dan waktunya dicatat.
- **FR-11:** Agent melihat status pengajuannya dan alasan penolakan.
- **FR-12:** Persetujuan tidak mengubah `school_assignments` dan tidak mengubah hasil perhitungan retention.

#### Check-in

- **FR-13:** Server menolak check-in agent di sekolah X pada tanggal D (WIB, jam server), kecuali (a) X sedang ditugaskan kepada agent itu, atau (b) agent punya rencana Terjadwal untuk X pada tanggal D. Aturan ini ada di satu fungsi di service, dipakai juga oleh pemilih sekolah.
- **FR-14:** Pesan penolakan menyebut sebabnya, misalnya "Sekolah ini bukan tugas Anda. Ajukan rencana kunjungan dulu." atau "Pengajuan Anda untuk sekolah ini masih menunggu persetujuan manager."
- **FR-15:** Saat check-in, kunjungan dihubungkan ke rencana Terjadwal agent itu untuk sekolah dan tanggal yang sama, jika ada (`visits.plan_id`). Check-in di sekolah sendiri tanpa rencana tetap boleh, dan kunjungannya tidak terhubung ke rencana. Menghubungkan `plan_id` di check-in tidak langsung membuat rencana Selesai; rencana baru Selesai saat kunjungan itu check-out (lihat bagian Status rencana).
- **FR-16:** Pemilih sekolah di layar Check-in hanya menampilkan sekolah yang lolos FR-13 hari ini: sekolah dengan rencana hari ini paling atas, lalu sekolah yang ditugaskan. Di bawahnya ada tombol "Ajukan kunjungan ke sekolah lain".

#### Hubungan dengan penugasan dan akun

- **FR-17:** Saat sekolah dilepas dari agent (dipindah atau dicabut), rencana saya milik agent itu untuk sekolah tersebut yang Terjadwal tanpa pemutus, bertanggal hari ini atau setelahnya, dan belum punya kunjungan, kembali menjadi Menunggu persetujuan. Terjadi di transaksi penugasan yang sama dan tercatat di audit log.
- **FR-18:** Saat sekolah ditugaskan ke agent, pengajuan agent itu untuk sekolah tersebut yang Menunggu persetujuan dan bertanggal hari ini atau setelahnya menjadi Terjadwal tanpa pemutus. Satu transaksi, tercatat di audit log.
- **FR-19:** Saat akun agent dinonaktifkan, rencananya yang bertanggal hari ini atau setelahnya dan belum punya kunjungan dibatalkan di transaksi yang sama.

#### Tampilan dan laporan

- **FR-20:** Agent: halaman Rencana dengan tab Mendatang (Terjadwal dan Menunggu persetujuan) dan Riwayat (Selesai, Terlewat, Ditolak, Dibatalkan, Kedaluwarsa). Setiap rencana menampilkan sumber (Dari manager atau Rencana saya), status, tanggal, sekolah, dan tujuan.
- **FR-21:** Agent: Beranda menampilkan rencana hari ini dengan tombol Check-in.
- **FR-22:** Manager dan admin: halaman Jadwal kunjungan dengan tab Menunggu persetujuan (jumlahnya tampil di menu samping) dan Semua rencana (filter agent, sekolah, rentang tanggal, status, sumber), serta tombol Buat jadwal.
- **FR-23:** Dashboard manager menampilkan jumlah pengajuan yang menunggu (tidak ikut pilihan periode), serta jumlah rencana terlaksana dan terlewat pada periode terpilih. Dashboard agent menampilkan rencana terlaksana dan terlewat miliknya.
- **FR-24:** Detail kunjungan menampilkan rencana yang terhubung (sumber dan tujuan), atau "Tanpa rencana".

#### Hak akses dan audit

- **FR-25:** Agent hanya melihat rencananya sendiri, termasuk jadwal dari manager untuknya. Rencana agent lain dijawab 404.
- **FR-26:** Agent tidak melihat nilai kontrak dan retention sekolah yang bukan tugasnya, termasuk di layar pengajuan (aturan lama tetap berlaku).
- **FR-27:** Setiap pembuatan, persetujuan, penolakan, pembatalan, dan perubahan status otomatis rencana menulis `audit_logs` di transaksi yang sama, lewat helper audit yang sudah ada.

### Pengalaman pengguna

Layar baru belum ada di Figma. Sebelum dibangun, perlu frame di halaman `02 Agent (HP)` dan `03 Manager`. Jika frame tidak dibuat, susunan diambil dari `docs/design-system/skolla-lms/pola-halaman.md`.

| Peran | Layar | Jenis |
|---|---|---|
| Agent (HP) | Rencana: daftar Mendatang dan Riwayat | Baru |
| Agent (HP) | Buat rencana: pilih sekolah (Sekolah saya di atas, sekolah lain bertanda "Perlu persetujuan"), tanggal, tujuan | Baru |
| Agent (HP) | Beranda: blok Rencana hari ini | Ubah |
| Agent (HP) | Check-in: pemilih sekolah dibatasi, tombol Ajukan kunjungan ke sekolah lain | Ubah |
| Manager dan admin | Jadwal kunjungan: tab Menunggu persetujuan dan Semua rencana | Baru |
| Manager dan admin | Dialog Buat jadwal | Baru |
| Manager dan admin | Detail pengajuan dengan tombol Setujui dan Tolak | Baru |
| Manager dan admin | Dashboard: pengajuan menunggu, rencana terlaksana dan terlewat | Ubah |
| Manager dan admin | Detail kunjungan: rencana terkait | Ubah |

Status rencana tampil sebagai chip berteks, bukan warna saja.

### Edge case

| Skenario | Perilaku |
|---|---|
| Agent check-in di sekolah lain tanpa rencana | Ditolak 403 dengan pesan FR-14 |
| Pengajuan masih menunggu saat agent sudah tiba di sekolah | Ditolak 403 "masih menunggu persetujuan". Manager bisa menyetujui saat itu juga, lalu agent check-in |
| Rencana Terjadwal lewat tanggalnya tanpa kunjungan | Menjadi Terlewat. Izin tidak terbawa ke hari berikutnya |
| Manager memutus pengajuan yang tanggalnya sudah lewat | Ditolak 409. Pengajuan tampil Kedaluwarsa |
| Dua manager memutus pengajuan yang sama bersamaan | Yang pertama berlaku, yang kedua mendapat 409 |
| Agent membuat rencana kedua untuk sekolah dan tanggal yang sama | Ditolak 409 |
| Dua rencana di hari yang sama ke sekolah berbeda | Boleh. Aturan satu kunjungan ONGOING per agent tetap berlaku |
| Dua check-in di sekolah yang sama pada tanggal rencana | Boleh, izin berlaku sepanjang tanggal itu. Hanya kunjungan pertama yang terhubung ke rencana |
| Agent sudah check-in sesuai rencana tapi belum check-out | Rencana tetap tampil Terjadwal, bukan Selesai. Beranda tetap menampilkan kunjungan itu sebagai "berlangsung" |
| Tanggal rencana berakhir (lewat tengah malam WIB) sementara kunjungan yang terhubung masih ONGOING | Rencana tetap Terjadwal, bukan Terlewat, selama kunjungan belum check-out. Berubah ke Selesai saat check-out. Terlewat hanya kalau tidak ada kunjungan terhubung sama sekali |
| Manager menjadwalkan agent ke sekolah yang dipegang agent lain | Boleh, langsung Terjadwal. Dashboard menghitungnya sebagai kunjungan ke sekolah lain |
| Sekolah dipindah ke agent lain sebelum tanggal rencana | FR-17 |
| Sekolah ditugaskan ke agent yang punya pengajuan menunggu | FR-18 |
| Agent dinonaktifkan | FR-19 |
| Membatalkan rencana yang sudah punya kunjungan | Ditolak 409 |
| Agent WIT check-in pukul 01.30 WIT | Dihitung tanggal WIB sebelumnya (23.30 WIB), jadi rencana yang berlaku adalah rencana tanggal itu |
| Agent membuka atau membatalkan rencana agent lain lewat ID | 404 |

## Pertimbangan teknis

### Batasan

- Tanggal rencana memakai WIB, sama dengan tanggal di rekap.
- Aturan satu rencana aktif per agent, sekolah, dan tanggal ditegakkan di service dalam transaksi, karena MySQL tidak punya partial unique index. Polanya sama dengan aturan satu kunjungan ONGOING.
- Persetujuan, penolakan, dan pembatalan memakai update bersyarat (misalnya hanya jika status masih `PENDING`), supaya keputusan yang bersamaan tidak saling menimpa.
- Status Selesai, Terlewat, dan Kedaluwarsa dihitung, tidak disimpan.

### Usulan model data

Diperbarui di `docs/data-model.md` saat coding dimulai, setelah PRD ini disetujui.

Tabel baru `visit_plans`:

| Kolom | Tipe | Catatan |
|---|---|---|
| `plan_id` | INT AUTO_INCREMENT | Primary key |
| `agent_id` | INT, FK `users` | Agent yang akan berkunjung |
| `school_id` | INT, FK `schools` | |
| `plan_date` | DATE | Tanggal WIB |
| `purpose` | VARCHAR(255) | Tujuan kunjungan, wajib |
| `status` | ENUM `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` | |
| `created_by_id` | INT, FK `users` | Sama dengan `agent_id` berarti rencana saya; selain itu jadwal dari manager |
| `decided_by_id` | INT NULL, FK `users` | Pemutus. Kosong untuk rencana yang terjadwal karena penugasan |
| `decided_at` | DATETIME NULL | |
| `decision_note` | VARCHAR(255) NULL | Wajib saat ditolak |
| `created_at`, `updated_at` | DATETIME | |

Index: `(agent_id, plan_date)`, `(school_id, plan_date)`, `(status, plan_date)`.

Perubahan lain:

- Kolom baru `visits.plan_id` INT NULL, unik, FK ke `visit_plans`.
- Enum `AuditAction` bertambah `APPROVE`, `REJECT`, `CANCEL`. Entitas audit baru `visit_plans`: CREATE, APPROVE, REJECT, CANCEL, dan UPDATE untuk perubahan status otomatis (FR-17, FR-18).
- Produksi: skrip `backend/sql/deltas/003_visit_plans.sql` yang idempotent, dijalankan manual lewat DBeaver. `schema.prisma` diperbarui bersamaan.

### Titik integrasi (usulan endpoint)

| Metode | Path | Peran | Keterangan |
|---|---|---|---|
| GET | `/visit-plans?from&to&agentId&schoolId&status&source` | Semua (AGENT: milik sendiri) | Daftar rencana |
| POST | `/visit-plans` | ADMIN, MANAGER, AGENT | `{ agentId?, schoolId, planDate, purpose }`. Untuk AGENT, `agentId` selalu dirinya |
| GET | `/visit-plans/:id` | Semua (AGENT: milik sendiri) | Detail, plus profil sekolah untuk pemutus |
| POST | `/visit-plans/:id/approve` | ADMIN, MANAGER | `{ note? }` |
| POST | `/visit-plans/:id/reject` | ADMIN, MANAGER | `{ note }` wajib |
| POST | `/visit-plans/:id/cancel` | Pembuat, ADMIN, MANAGER | |
| GET | `/schools/options` | AGENT | Tambah penanda `assigned` dan `allowedToday` |
| POST | `/visits/check-in` | AGENT | Tambah cek FR-13, isi `plan_id` |
| PUT | `/schools/:id/assignment` | ADMIN, MANAGER | Tambah FR-17 dan FR-18 |
| PATCH | `/users/:id` | ADMIN, MANAGER | Tambah FR-19 saat akun dinonaktifkan |
| GET | `/dashboard/manager`, `/dashboard/agent` | | Tambah angka FR-23 |

### Data

- Tujuan kunjungan dan alasan penolakan bisa memuat informasi klien. Keduanya tidak ditulis ke log aplikasi.
- Tidak ada migrasi data. Kunjungan lama punya `plan_id` kosong, dan database produksi belum berisi data asli.

## Kontrak eksekusi

Untuk sesi Claude Code atau sub-agent yang mengerjakan PRD ini tanpa ikut diskusinya.

### Sumber acuan

| Sumber | Path | Menentukan |
|---|---|---|
| Rencana produk | `docs/PLAN.md` | Cakupan dan aturan produk. Menang jika bertentangan |
| PRD ini | `docs/prd-rencana-kunjungan.md` | Rincian FR, status, edge case |
| Memori proyek | `CLAUDE.md` | Aturan kode, database, tes, keamanan |
| Model data | `docs/data-model.md` | Setelah diperbarui dari bagian Usulan model data |
| Desain | Figma SA, halaman `02 Agent (HP)` dan `03 Manager` | Susunan layar, setelah frame dibuat |

### Jangan disentuh

| Path atau sistem | Alasan |
|---|---|
| `backend/src/services/retention.ts`, `contract-rules.ts` | Persetujuan tidak boleh mengubah retention (FR-12) |
| `school_assignments` dari alur persetujuan | Persetujuan adalah izin kunjungan, bukan penugasan |
| Baris `audit_logs` yang sudah ada | Audit log hanya ditambah |
| Database produksi lewat `prisma migrate` atau `db push` | Dilarang di CLAUDE.md. Pakai delta SQL |

### Peta verifikasi

| Kebutuhan | Cara membuktikan | Pemeriksa |
|---|---|---|
| FR-1, FR-2 | Tes database: status awal untuk tiga kombinasi pembuat dan sekolah di tabel status awal | Otomatis (Vitest) |
| FR-3, FR-4, FR-5 | Tes API: tanggal kemarin, tanggal lebih dari 90 hari, tujuan kosong ditolak 400; rencana ganda ditolak 409 | Otomatis |
| FR-6, FR-7 | Tes API: agent membatalkan jadwal dari manager ditolak 403; membatalkan rencana yang punya kunjungan ditolak 409 | Otomatis |
| FR-8 sampai FR-11 | Tes API dan E2E: ajukan, setujui, lalu check-in berhasil; tolak tanpa alasan ditolak 400; tolak dengan alasan, agent melihat alasannya | Otomatis, PM memeriksa layar |
| FR-12 | Tes database: isi `school_assignments` dan hasil retention sama persis sebelum dan sesudah persetujuan | Otomatis |
| FR-13, FR-14 | Tes unit fungsi izin check-in (tabel kasus: ditugaskan, rencana terjadwal, menunggu, ditolak, terlewat, tanpa apa pun) dan tes API check-in ditolak 403 dengan pesan | Otomatis |
| FR-15 | Tes database: `plan_id` terisi jika ada rencana, kosong jika tidak; check-in kedua di hari yang sama tidak terhubung | Otomatis |
| FR-16 | E2E: pemilih hanya menampilkan sekolah yang boleh hari ini | Otomatis |
| FR-17, FR-18 | Tes database: pindah penugasan mengubah status rencana dan menulis audit; perubahan batal jika audit gagal | Otomatis |
| FR-19 | Tes database: menonaktifkan agent membatalkan rencana mendatang | Otomatis |
| FR-20 sampai FR-24 | Tes unit status turunan (Selesai, Terlewat, Kedaluwarsa), E2E per layar, dan perbandingan visual dengan Figma | Otomatis, PM memeriksa layar |
| FR-25, FR-26 | Tes API: agent membuka rencana agent lain dijawab 404; detail pengajuan untuk agent tanpa nilai kontrak | Otomatis |
| FR-27 | Tes database: setiap aksi menulis audit dengan `action` yang benar | Otomatis |

### Berhenti dan tanya

| Kondisi | Tanyakan ke |
|---|---|
| Frame Figma untuk layar baru belum ada | Pemilik produk |
| Aturan di PRD ini bertentangan dengan PLAN.md atau CLAUDE.md | Pemilik produk |
| Butuh dependency baru | Pemilik produk |
| Perubahan menyentuh rumus retention atau logika penugasan di luar FR-17 dan FR-18 | Pemilik produk |
| Pertanyaan terbuka di bawah belum dijawab tetapi memengaruhi kode | Pemilik produk |

## Ketergantungan dan risiko

### Ketergantungan

| Ketergantungan | Pemilik | Status | Dampak jika terlambat |
|---|---|---|---|
| Frame Figma untuk layar baru | Pemilik produk | Belum ada | Layar dibangun dari `pola-halaman.md` lalu disesuaikan, atau rilis mundur |
| Pembaruan `CLAUDE.md`, `docs/data-model.md`, `docs/api-reference.md` | Pemilik produk menyetujui | Menunggu PRD ini disetujui | Sesi coding mengikuti aturan lama |
| Data asli sekolah dan penugasan Skolla Edtech | Pemilik produk | Belum diterima (lihat `HANDOFF.md`) | Tanpa penugasan, agent hanya bisa check-in lewat jadwal atau pengajuan yang disetujui |
| Uji kamera dan GPS di HP lewat HTTPS | Tim internal Skolla | Belum | Sama seperti sebelum revisi ini |

### Risiko

| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| Penugasan belum lengkap saat rilis, sehingga agent terhalang check-in | Tinggi (data asli belum masuk) | Tinggi | Syarat rilis: semua sekolah klien aktif sudah ditugaskan. Halaman Penugasan sudah menampilkan sekolah tanpa agent |
| Manager lambat memutus, pengajuan kedaluwarsa, kunjungan batal | Sedang | Sedang | Jumlah pengajuan menunggu di menu samping dan dashboard; agent dianjurkan mengajukan sehari sebelumnya; pantau ukuran Pengajuan kedaluwarsa |
| Agent perlu kunjungan mendadak ke sekolah lain | Sedang | Sedang | Pengajuan untuk hari ini boleh; manager bisa memutus dari HP |
| Rilis MVP mundur | Tinggi | Sedang | Kerjakan per tahap di bawah, backend dulu |
| Pengecekan izin menambah query di setiap check-in | Rendah | Rendah | Index `(agent_id, plan_date)` |

## Tahapan

Tanggal target ditentukan pemilik produk.

| Tahap | Isi |
|---|---|
| M1 | PRD disetujui. `CLAUDE.md`, `docs/data-model.md`, `docs/api-reference.md` diperbarui |
| M2 | Frame Figma untuk layar baru dan yang berubah |
| M3 | Backend: delta `003_visit_plans.sql`, service rencana, fungsi izin check-in, perubahan di penugasan dan penonaktifan akun, endpoint, tes |
| M4 | Frontend agent: Rencana, Buat rencana, Beranda, Check-in |
| M5 | Frontend manager dan admin: Jadwal kunjungan, persetujuan, dashboard, detail kunjungan |
| M6 | E2E live dan audit keamanan ulang untuk endpoint baru |
| Rilis | Bersama MVP, setelah penugasan asli terisi |

## Pertanyaan terbuka

Keputusan di bawah sudah dipakai sebagai asumsi di PRD ini. Mohon dikonfirmasi atau diganti.

- [ ] Izin kunjungan hanya berlaku di tanggal rencana (WIB). Perlukah rentang beberapa hari? Pemilik: pemilik produk
- [ ] Admin ikut bisa membuat jadwal dan memutus pengajuan. Pemilik: pemilik produk
- [ ] Agent yang memegang sekolah tidak diberi tahu jika agent lain dijadwalkan atau disetujui ke sekolahnya. Pemilik: pemilik produk
- [ ] Tanggal rencana paling jauh 90 hari ke depan. Pemilik: pemilik produk
- [ ] Agent tidak bisa menolak jadwal dari manager; hanya manager atau admin yang membatalkannya. Pemilik: pemilik produk
- [ ] Rencana tidak wajib untuk check-in di sekolah sendiri. Pemilik: pemilik produk
- [ ] Target ukuran keberhasilan (80%, kurang dari 1 hari kerja, 10%). Pemilik: pemilik produk

## Lampiran

### Dokumen terkait

- Rencana produk: `docs/PLAN.md`
- Model data: `docs/data-model.md`
- Arsitektur: `docs/architecture.md`
- API: `docs/api-reference.md`
- Desain: https://www.figma.com/design/vRVwtJvisOBQ0mc1OhkJ1u/SA

### Riwayat revisi

| Versi | Tanggal | Penulis | Perubahan |
|---|---|---|---|
| 1.0 | 2026-11-15 | Claude Code bersama pemilik produk | Draf pertama |

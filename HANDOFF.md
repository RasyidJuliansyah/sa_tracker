# Serah terima sesi (diperbarui 14 November 2026, malam, setelah Dashboard)

Untuk sesi Claude Code berikutnya (akun mana pun). Baca ini dulu, lalu CLAUDE.md dan docs/ (PLAN.md, architecture.md, data-model.md, design-system.md).

## Keputusan user
- Selesaikan SEMUA tampilan UI dari Figma dulu (data tiruan, tanpa backend). Backend dan database dikerjakan setelahnya.
- Figma: https://www.figma.com/design/vRVwtJvisOBQ0mc1OhkJ1u/SA (file key `vRVwtJvisOBQ0mc1OhkJ1u`). Halaman: 00 Fondasi, 01 Umum, 02 Agent (HP), 03 Manager, 04 Sekolah & Kontrak, 05 Admin.
- Layar "Ganti password pertama" di-skip (password direset oleh admin).
- Layar dikerjakan lewat sub-agent hemat token, dua paralel, tiap agent di git worktree sendiri.
- Token warna dari `docs/design-system/skolla-lms/tokens.json`, bukan Figma (nilai Figma bertanda * masih sementara).

## Status
Repo: `/Users/rasyidjuliansyah/Development/sa-visit-tracker` (repo git sendiri, branch kerja `chore/setup`). Tes terakhir: Vitest frontend 71 lulus, E2E 88 lulus, typecheck dan build lulus. Commit terakhir: Dashboard manager (a43dcb3).

| Bagian | Status |
|---|---|
| Backend scaffold, schema Prisma, `001_init.sql`, seed | Selesai |
| Fondasi UI (rangka, komponen bersama, tema, helper format) | Selesai |
| Login | Selesai |
| Admin (5 layar) | Selesai |
| Agent HP (9 layar) | Selesai |
| Manager: Rekap, Detail kunjungan, Akun agent + dialog | Selesai, ter-merge |
| Sekolah & Kontrak (10 layar, Impor/Ekspor CSV, Penugasan, Target retention) | Selesai, ter-merge |
| Manager Dashboard (Figma node 17:2) | Selesai: periode Hari/Minggu/Bulan (WIB), retention tahunan, perlu perhatian, StatCard, grafik ApexCharts 3 tab, kontribusi, peringkat agent + dialog Rincian, sekolah belum dikunjungi, tabel kunjungan |

**SEMUA layar UI dari Figma sudah selesai** (kecuali Ganti password, di-skip). User sudah memeriksa dan menyetujui UI. Berikutnya: backend (lihat Langkah berikutnya).

Semua worktree sudah dihapus; semua branch fitur sudah ter-merge ke `chore/setup`.

## Langkah berikutnya (urut)
UI Figma sudah diperiksa user dan disetujui. Sekarang fase backend, mengikuti **`docs/backend-plan.md`** (rencana tahap B0–B10, sudah disetujui).
Keputusan: token login = cookie httpOnly; ganti password pertama dihapus dari MVP (password hanya direset admin); database uji `sa_visit_tracker_test`; mulai dari logika murni.
1. **B0 dan B1 SELESAI** di branch `feat/api-fondasi` (backend: `AppError`, error handler, request id + log, `zod` terpasang; `utils/timezone|period|csv|password`, `services/contract-rules|retention`; 22 tes Vitest lulus termasuk contoh sekolah A dan B). **B2 helper selesai:** `services/audit.ts` (`writeAudit`, `withAudit`, buang kolom rahasia), tes unit + tes database (`backend/tests/db/`, atomik: audit gagal = data batal). Database uji `sa_visit_tracker_test` dibuat ulang dengan `backend/scripts/reset-test-db.sh` (root lewat container, tes membaca DATABASE_URL lalu mengganti nama DB; 26 tes lulus). Sisa: endpoint baca audit log (butuh auth, dikerjakan setelah B3) dan infrastruktur pytest integrasi API. 
**B3 SELESAI (auth):** backend `POST /api/auth/login|logout`, `GET /api/me` (cookie httpOnly SameSite=Lax, JWT 8 jam, cek Origin untuk CSRF, rate limit login 10/15 mnt, LOGIN/LOGIN_FAILED di audit, akun nonaktif langsung ditolak), middleware `authenticate`/`requireRole`; 33 tes backend lulus (tes API memakai Vitest + fetch ke database uji, bukan pytest: lebih ringan; ubah bila ingin pytest). Frontend: `services/http.ts`, `stores/session.ts` sungguhan, guard rute per peran, Login tersambung. Dependency baru: `jsonwebtoken`, `express-rate-limit`.
**Mode tiruan untuk UI/E2E:** `?as=` kini hanya aktif bila frontend dijalankan `npm run dev:mock` (VITE_MOCK_AUTH=1). Hapus mode ini bila semua layar sudah memakai API (B8). E2E: jalankan `npm run dev:mock`; port 3010 sempat dipakai aplikasi lain, tes tidak lagi menulis port tetap (pakai `--base-url`). `?preview=galat` dan galeri komponen: galat dihapus, galeri tetap hanya dev.
Belum ada tombol Keluar di UI (tidak ada di Figma); `session.logout()` sudah ada. 
**B4 BACKEND SELESAI:** akun (`/users`), master (`/master/jenjang|packages`), baca audit log (`/audit-logs`); delta `002_users_last_login.sql` (sudah dijalankan di DB dev & uji), `users.last_login_at` terisi saat login; login pertama menghapus penanda `must_change_password`. Password sementara boleh dikirim klien (UI Figma membuatnya di dialog), kalau kosong dibuat server. 42 tes backend lulus. Kontrak ada di `docs/api-reference.md`.
**Berikutnya: sambungkan layar B4 ke API** (Akun, Master data, Akun agent, Audit log): ganti `services/admin.ts` dan sebagian `manager.ts` agar memakai `api()` (pertahankan versi tiruan untuk mode `dev:mock`). Hal yang perlu diputuskan: filter pelaku audit di UI memakai nama tetap, perlu daftar dari API; kolom "Sekolah ditugaskan" di Akun agent baru tersedia setelah B6.
2. B2 audit log + transaksi, B3 auth (cookie httpOnly, RBAC, hapus kode sementara `?as=`/`session.ts`/`?preview=galat`/galeri), B4 akun + master, B5 sekolah + kontrak, B6 penugasan + target, B7 check-in/out + foto, B8 dashboard, B9 impor/ekspor CSV, B10 audit keamanan + Docker. Detail dan layar yang hidup per tahap ada di rencana.
3. Dokumen yang menunggu persetujuan user untuk disesuaikan: kalimat "wajib ganti password saat login pertama" di `docs/PLAN.md` (Akses) dan `CLAUDE.md` (Autentikasi); baris "Status: MVP, belum ada kode" di CLAUDE.md.
4. Isi `docs/api-reference.md` per tahap sebelum menulis endpoint. Perbarui peta codebase di akhir tahap (`python3 tools/codebase-map.py`).

## Panduan memeriksa UI (alur per peran)
Frontend harus jalan (`cd frontend && npm run dev`, port 3010). Ganti peran lewat `?as=` di URL. Kelompok layar mengikuti urutan alur nyata:
- **Login** (`/login`, `/login?preview=galat`, lebar HP juga).
- **Agent, lebar HP 390px** (`/agent?as=agent`): Beranda (kunjungan berlangsung, periode, retention, Belum dikunjungi, Kontrak perlu perhatian) → Check-out (`/agent/check-out`, laporan wajib) → selesai → Check-in (`/agent/check-in`: pilih sekolah, foto + lokasi, izin ditolak) → Sekolah saya → Detail sekolah → Riwayat.
- **Manager, desktop 1440px** (`/dashboard?as=manager`): Dashboard (ganti periode, filter agent, tab grafik, Rincian agent) → Rekap kunjungan (`/rekap`) → Detail kunjungan (klik baris) → Sekolah (`/sekolah`, halaman sekolah 4 tab, Tambah sekolah, Catat perpanjangan) → Penugasan (`/penugasan`, Pindahkan) → Target retention → Impor & ekspor (`/impor-ekspor`) → Akun agent (`/akun-agent`, Ubah) → Audit log (`/audit-log`).
- **Admin** (`/akun?as=admin`): Akun (Tambah akun, Reset password) → Master data (`/master-data`) → Audit log. Sidebar admin juga punya Dashboard, Rekap, Sekolah, Penugasan, Target, Impor.
- Galeri komponen bersama: `/_komponen`.
- Perbandingan visual dengan Figma tersimpan di `tests/e2e/visual/*.vue.png` dan `*.figma.png` (kiri/kanan).

## Cara menjalankan
- Node 24 lewat fnm: `export PATH=/opt/homebrew/bin:$PATH` lalu `fnm exec --using=24 <perintah>` (shell default Node 22).
- Frontend: `cd frontend && npm run dev` (port 3010). Backend: `cd backend && npm run dev` (port 3011).
- Ganti peran saat dev: `?as=admin|manager|agent` di URL. Galeri komponen: `/_komponen`.
- Database lokal: container Docker `sa-visit-mysql` (port 3308), kredensial di `backend/.env` (di-gitignore). Seed: `cd backend && npm run seed` (password semua akun `Password123!`).
- Tes: `cd frontend && npm test`, `npm run typecheck`, `npm run build`; E2E `.venv/bin/pytest tests/e2e` (frontend harus jalan di 3010).

## Pola kerja sub-agent (pelajaran)
- Worktree dibuat MANUAL dari repo ini: `git worktree add ../sa-visit-tracker-wt/<nama> -b feat/<nama> chore/setup`, lalu `ln -s <repo>/frontend/node_modules <worktree>/frontend/node_modules`, dan tambahkan `frontend/node_modules` ke `$(git rev-parse --git-path info/exclude)` di worktree. Opsi `isolation: worktree` otomatis TIDAK dipakai: ia membuat worktree di repo induk `~/Development` (proyek lain).
- Tiap agent hanya menyentuh `views/<area>/`, `components/<area>/`, `mocks/<area>.ts`, `services/<area>.ts`, file rute areanya, tes areanya. File bersama (`global.css`, `plugins/`, komponen bersama, `layouts/`, `utils/`, `router/index.ts`) hanya diubah dari sesi utama. Agent yang terhenti bisa dilanjutkan lewat `SendMessage` ke id-nya selama sesi yang sama.
- Prompt agent: satu layar per langkah, `get_design_context` dengan `excludeScreenshot: true`, satu screenshot Figma per layar, laporan akhir maksimal ~300 kata.

## Selisih dan keraguan yang perlu diputuskan user
- Warna Figma lebih pucat dari token untuk chip hijau/kuning/merah, `border`, `text-secondary`, `brand-soft`, `canvas-table`, `accent-surface`. Token yang dipakai. Kalau Figma yang benar, ubah `tokens.json` (satu perubahan, semua layar ikut).
- Figma saling bertentangan di data tiruan: Agent (Depok dikunjungi atau belum, urutan baris), Penugasan (jumlah sekolah per agent: dipakai hitungan dari data, Dimas 4, Ayu 4, Yohanes 3), Impor CSV (filter "Gagal (3)" menampilkan 5 baris di Figma; dipakai 3).
- Tab Kontrak dan Kunjungan di halaman sekolah ada di Figma tetapi tidak dirancang (diisi tabel yang sama dengan Ringkasan). Tombol "Ubah data" sekolah hanya snackbar karena layar ubah data tidak ada di Figma.
- Rumus retention di UI hanya rasio sederhana atau angka tetap; rumus kohort asli (docs/PLAN.md, "Retention dan target") belum diimplementasikan, itu tugas backend.
- Sisa selisih kecil: tombol halaman berikutnya abu saat hanya satu halaman, scrim dialog lebih terang, posisi tombol tutup dialog sedikit berbeda (DialogShell milik admin), jam "sekarang" tiruan dikunci ke Sabtu 14 Nov 2026 10.40 WIB, state tiruan hilang saat reload.
- Dashboard manager: filter agent hanya memengaruhi peringkat, kontribusi, perlu perhatian, sekolah belum dikunjungi, dan tabel (StatCard dan grafik tetap data tiruan semua agent). Status "Sesuai target" per agent adalah data (`met`), bukan dibandingkan dengan persentase: itu sengaja, mengikuti aturan "kontrak yang sudah diputuskan" di PLAN.md (Ayu 62,7% tetap Sesuai target di Figma).
- Tombol panah periode di Beranda agent belum berfungsi; ekspor CSV hanya UI.

## Catatan
- Folder `~/Development/sa-visit-tracker-old/` berisi kode lama (di luar repo, boleh dihapus). File lama di root repo (PHASE_*.md, dev.sh, scripts/, dst) belum dibersihkan dan tidak ter-commit.
- `HANDOFF.md` ini belum di-commit; tanya user sebelum meng-commit.

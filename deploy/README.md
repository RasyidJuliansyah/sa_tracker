# Deploy produksi

Dua container (backend, frontend) lewat Docker Compose; database MySQL, SSL, dan domain diurus di luar (server internal Skolla). Aturan lengkap: `docs/architecture.md` (bagian Deploy dan Migrasi database).

## Langkah
1. Di server: `git pull`, lalu `cp .env.production.example .env.production` dan isi (jangan di-commit). `JWT_SECRET` wajib acak ≥ 32 karakter; `CORS_ORIGIN` = alamat HTTPS frontend persis.
2. Siapkan folder foto di host (`PHOTO_HOST_DIR`), beri hak tulis ke uid 1000: `mkdir -p /srv/sa-visit/photos && chown 1000:1000 /srv/sa-visit/photos`. Masukkan ke jadwal backup.
3. Jalankan skrip SQL delta baru di `backend/sql/deltas/` secara manual lewat DBeaver (idempotent, berurutan). Jangan memakai `prisma migrate` atau `db push` di produksi.
4. `./deploy.sh` (membangun image, menyalakan container, menunggu backend sehat).
5. Pasang Nginx di host memakai `nginx.example.conf` sebagai dasar: `/api/` ke `127.0.0.1:3011`, `/` ke `127.0.0.1:3010`, HTTPS wajib (GPS dan kamera tidak jalan tanpa HTTPS), tepat satu proxy di depan backend.

## Akun pertama
Database baru perlu minimal satu akun ADMIN (bcrypt hash). Buat lewat DBeaver atau seed sekali pakai di lingkungan aman, lalu ganti/reset password-nya dari menu Akun. Jangan menjalankan `npm run seed` di produksi: seed berisi akun uji.

## Uji sebelum dipakai tim (di HP sungguhan, lewat HTTPS)
- Login agent, buka Check-in: izin lokasi muncul dan akurasi terbaca.
- Ambil foto dari kamera, check-in, lalu check-out dengan laporan.
- Login manager: kunjungan muncul di Rekap beserta foto, lalu ekspor CSV terunduh dan dibuka di Excel tanpa rumus aktif.
- Pastikan `docker logs sa-visit-backend` tidak memuat password, token, atau koordinat.

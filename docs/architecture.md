# Arsitektur SA Visit Tracker

Dokumen ini adalah acuan arsitektur proyek. Polanya diambil dari aplikasi Skolla BSC & OKR Suite (`docs/PROJECT_ARCHITECTURE_SPEC.md`, ditulis user), lalu disesuaikan dengan keputusan di `docs/PLAN.md`. Kalau ada yang bertentangan, file ini dan `docs/PLAN.md` yang berlaku.

## Hubungan dengan spec OKR

`docs/PROJECT_ARCHITECTURE_SPEC.md` menjelaskan aplikasi lain. File itu dipakai **hanya sebagai contoh pola arsitektur**. Jangan membangun fitur OKR apa pun darinya (objective, key result, sprint, roadmap, strategy map, rollup, impersonasi, PostHog).

| Hal | Diambil dari spec OKR | Berbeda di proyek ini |
|---|---|---|
| Backend | Express + TypeScript strict, folder `controllers/`, `routes/`, `middleware/`, `services/` | |
| Auth | JWT Bearer, bcrypt, middleware RBAC | Tiga peran: ADMIN, MANAGER, AGENT. Tanpa impersonasi |
| State frontend | Pinia | |
| Repo | Folder `backend/` dan `frontend/` | |
| Deploy | Docker multi-stage, Docker Compose, Nginx di host dengan SSL, `/` ke frontend dan `/api` ke backend | Port berbeda dari aplikasi OKR |
| Migrasi produksi | Tanpa `prisma migrate` dan `db push` di produksi; skrip SQL delta idempotent lewat DBeaver | |
| Database | MySQL 8, `charset=utf8mb4` | Database sendiri, `sa_visit_tracker` |
| Frontend | | Vue 3 + Vite (SPA), bukan Nuxt |
| UI | | Vuetify 3 + token design system LMS, bukan CSS scoped murni dengan token OKR |
| Grafik | | ApexCharts, bukan Chart.js |
| Runtime | | Node.js 24, bukan Node 20 (sudah berakhir masa dukungannya 30 April 2026) |
| ORM | | Prisma 7, bukan Prisma 5 |
| ID | | `INT AUTO_INCREMENT`, bukan UUID |

## Struktur repo

```
sa-visit-tracker/
├── backend/                Express + TypeScript + Prisma
│   ├── prisma/schema.prisma
│   ├── prisma.config.ts    URL koneksi Prisma 7
│   ├── sql/deltas/         Skrip SQL produksi, bernomor urut
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/     auth JWT, guard peran, penanganan galat
│   │   ├── services/       logika bisnis, transaksi, audit log
│   │   ├── utils/          helper murni: periode kontrak, zona waktu, format, CSV
│   │   └── index.ts
│   ├── tests/unit/         Vitest
│   ├── Dockerfile
│   └── .env.example
├── frontend/               Vue 3 + Vite + Vuetify 3 + Pinia
│   ├── src/
│   │   ├── views/          dibagi per peran: admin/, manager/, agent/
│   │   ├── components/
│   │   ├── stores/         Pinia
│   │   ├── plugins/vuetify.ts   tema, defaults, locale
│   │   ├── router/
│   │   └── utils/
│   ├── tests/unit/         Vitest
│   ├── Dockerfile
│   └── .env.example
├── tests/                  Python + Playwright
│   ├── e2e/
│   ├── integration/
│   └── requirements.txt
├── docker-compose.yml
├── docs/
└── CLAUDE.md
```

Folder `backend/` dan `frontend/` dibuat di langkah 1 oleh generator masing-masing.

## Backend

- Alur request: `routes/` memetakan URL ke `controllers/`, controller memvalidasi input lalu memanggil `services/`, dan hanya `services/` yang menyentuh Prisma.
- Setiap perubahan data transaksi dan penulisan `audit_logs` terjadi di dalam satu `prisma.$transaction` di layer service.
- Middleware `auth` memverifikasi JWT. Middleware guard peran memeriksa ADMIN, MANAGER, atau AGENT per rute. Pembatasan "data milik sendiri" untuk AGENT dicek di service, bukan di route saja.
- Semua rute di bawah prefiks `/api`.
- Foto kunjungan diunggah ke backend, disimpan di `PHOTO_STORAGE_DIR`, dan disajikan lewat rute yang mengecek hak akses. Folder itu tidak disajikan langsung oleh Nginx.
- Log aplikasi ke stdout dalam JSON satu baris.

## Autentikasi

- Login dengan email dan password, mengembalikan JWT. Payload hanya berisi id user, peran, dan nama; tidak ada data sensitif.
- Password di-hash dengan bcrypt.
- `JWT_SECRET` dibuat acak dan panjang, hanya ada di `.env` server. Jangan pernah menuliskan nilai secret di dokumen, README, atau contoh `.env`.
- Masa berlaku token dan tempat penyimpanannya di browser diputuskan di langkah 4. Hindari `localStorage` untuk token.

## Frontend

- Vue 3 Composition API dengan `<script setup>` dan TypeScript.
- Vuetify 3 dipasang di `plugins/vuetify.ts` dengan tema, `defaults`, dan locale Indonesia sesuai `docs/design-system.md`.
- Pinia untuk sesi login dan data bersama. Vue Router dengan guard per peran.
- ApexCharts lewat paket pembungkus Vue 3-nya.
- Alamat API dibaca dari `VITE_API_BASE`.

## Environment

`backend/.env.example`:

```env
PORT=3011
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/sa_visit_tracker?charset=utf8mb4"
JWT_SECRET="isi-dengan-string-acak-panjang"
PHOTO_STORAGE_DIR=./storage/visit-photos
CORS_ORIGIN="http://localhost:3010"
```

`frontend/.env.example`:

```env
VITE_API_BASE="http://localhost:3011/api"
```

## Deploy

- Dua container lewat `docker-compose.yml`: `sa-visit-backend` dan `sa-visit-frontend`, keduanya multi-stage dari `node:24-alpine`. Frontend dibangun menjadi file statis lalu disajikan oleh server statis ringan di container-nya.
- Port **3010** (frontend) dan **3011** (backend), supaya tidak bentrok dengan aplikasi OKR di 3000 dan 3001. Sudah dipastikan aman dengan tim internal.
- Nginx di host menangani SSL dan meneruskan `/` ke frontend dan `/api` ke backend. Konfigurasi Nginx dan sertifikat diurus tim internal Skolla.
- Folder foto adalah volume yang di-mount ke container backend dan ikut di-backup.

## Migrasi database

Aturan dari tim, berlaku mutlak:

- **Dilarang menjalankan `prisma migrate` atau `prisma db push` di MySQL produksi.**
- Setiap perubahan struktur database produksi berupa skrip SQL delta di `backend/sql/deltas/`, bernama `NNN_deskripsi.sql` (misalnya `001_init.sql`, `002_tambah_kolom_x.sql`), lalu dijalankan manual lewat DBeaver.
- Skrip harus idempotent: aman dijalankan dua kali. `CREATE TABLE IF NOT EXISTS` bisa dipakai. Untuk menambah kolom atau index, cek dulu `information_schema`, karena setahuku MySQL 8 tidak mendukung `ADD COLUMN IF NOT EXISTS` (yang itu fitur MariaDB). Cek ulang di versi MySQL server yang dipakai.
- `backend/prisma/schema.prisma` selalu diperbarui bersamaan dengan skrip delta, supaya Prisma Client tetap sinkron. Setelah itu jalankan `npx prisma generate`.
- Di lokal, `prisma migrate dev` boleh dipakai untuk mencoba perubahan. Draf SQL delta bisa dibuat dengan `prisma migrate diff`, lalu dirapikan dan dibuat idempotent secara manual. Cek nama flag-nya di dokumentasi Prisma 7.

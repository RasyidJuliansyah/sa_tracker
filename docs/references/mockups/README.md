# Mockup UI

Folder ini berisi mockup buatan user, dalam bentuk gambar atau screenshot. Mockup adalah acuan susunan layar. Warna, tipografi, radius, dan komponen tetap mengikuti `docs/design-system.md`.

Penamaan file yang disarankan: `<peran>-<halaman>.png`, misalnya `manager-dashboard.png`, `agent-check-in.png`, `admin-kelola-akun.png`. Kalau satu halaman punya beberapa keadaan, tambahkan akhiran: `agent-check-in-galat-gps.png`.

Setiap mockup punya file spesifikasi `.md` dengan nama yang sama. Kode Vue dibangun dari spesifikasi itu, bukan dengan menyalin kode mockup.

Daftar mockup:

| File | Halaman | Catatan |
|---|---|---|
| `manager-dashboard.html` | Dashboard manager | Mockup asli, Tailwind. Spesifikasi dan koreksinya di `manager-dashboard.md` |

Halaman yang belum punya mockup dibangun dengan pola di `docs/design-system/skolla-lms/pola-halaman.md`, lalu disesuaikan saat mockup-nya masuk.

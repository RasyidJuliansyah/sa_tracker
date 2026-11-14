# Card

Permukaan putih berbingkai di atas latar `canvas`. Pembungkus hampir semua isi halaman di
LMS ini.

| Properti | Nilai |
|---|---|
| Latar | `surface` |
| Border | `border-width` `border` |
| Radius | `radius-md` |
| Padding | `space-6` |
| Bayangan | tidak ada |

Kartu tidak memakai bayangan. Pemisahnya garis, bukan elevasi; `shadow-1` hanya untuk
kartu yang sedang dipilih, dan `shadow-3` hanya untuk lapisan yang benar-benar mengambang
seperti drawer dan menu.

Judul kartu memakai gaya `card-title` warna `text`, dengan tombol aksi rata kanan di baris
yang sama. Subjudul memakai `section-title` warna `text-secondary`.

Varian:

- **Tipis**: border `border-subtle`. Dipakai kartu statistik dan kartu di dalam kartu.
- **Bertint**: latar dan border mengikuti satu peran semantik, misalnya `info-surface`
  dengan border `brand-soft` untuk banner informasi.
- **Terpilih**: border `brand`, latar `brand-soft`, ditambah `shadow-1`.

Produksi punya tujuh kelas kartu dengan lima lebar garis berbeda, ditambah bahasa visual
tersendiri di modul analisis butir soal (radius 12px, padding 20px, enam tint baru yang
tidak ada di palet, temuan 22). Tiga varian di atas yang sah; `radius-lg` disisakan khusus
untuk kartu pilihan metode di modul itu.

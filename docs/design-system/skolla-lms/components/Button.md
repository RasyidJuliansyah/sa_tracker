# Button

Tiga ukuran, empat varian, bobot huruf 600 untuk semuanya.

Produksi punya tujuh kombinasi tombol yang dipakai bergantian tanpa aturan: radius primer
berbeda antara halaman daftar (24px) dan bank soal (`9999px`), bobot hurufnya 500 di satu
halaman dan 600 di halaman lain, dan padding horizontalnya punya empat nilai. Tabel di
bawah menggantikan semuanya (temuan 8 dan 19).

| Ukuran | Tinggi | Teks | Padding |
|---|---|---|---|
| `sm` | `control-sm` 28px | `button-sm` | `space-3` |
| `md` | `control-md` 36px | `button` | `space-5` |
| `lg` | `control-lg` 40px | `button` | `space-6` |

| Varian | Dipakai untuk | Tampilan |
|---|---|---|
| `filled` | Satu aksi utama per layar | Latar `brand`, teks `text-on-brand` |
| `outline` | Aksi sekunder di halaman daftar dan toolbar | Border `border-width-strong` `brand`, teks `brand` |
| `tonal` | Aksi sekunder di dalam form, termasuk Kembali | Latar `brand-soft`, teks `brand` |
| `danger` | Hapus dan aksi yang tak bisa dibatalkan | Border `border-width-strong` `error-solid`, teks `error-text` |

Pakai satu varian saja untuk aksi sekunder dalam satu konteks. Sekarang halaman daftar
memakai outline dan form memakai tonal untuk peran yang sama (temuan 25); aturannya:
outline di toolbar halaman, tonal di dalam form.

Radius `radius-pill` untuk semua varian. `text-transform: none` dan
`letter-spacing: normal`. Tombol nonaktif memakai `canvas-alt` dengan teks
`text-disabled`, dan tidak boleh jadi satu-satunya penjelasan kenapa aksi tidak bisa
dipakai; sertakan alasannya di dekatnya.

Konsumen menyediakan ikon sendiri (Material Design Icons 20px untuk `md` dan `lg`, 16px
untuk `sm`), ditaruh sebelum teks dengan jarak `space-2`.

Setiap tombol wajib punya `:focus-visible` dengan outline `border-width-strong` warna
`brand` dan offset 2px. Produksi sekarang tidak menampilkan apa pun saat tombol menerima
fokus (temuan 12).

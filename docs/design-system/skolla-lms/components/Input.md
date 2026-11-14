# Input

Field teks, select, dan pencarian, semuanya setinggi `control-input` 42px.

Label berada di atas field, gaya `body`, warna `text`. Tanda wajib isi berupa asterisk
`error-solid` setelah label. Placeholder memakai pola "Masukkan ..." dan warna
`text-disabled`, jadi tidak boleh memuat informasi yang dibutuhkan untuk mengisi.

| Properti | Nilai |
|---|---|
| Tinggi | `control-input` |
| Border | `border-width` `border` |
| Radius | `radius-sm`, tetap sama di state galat |
| Padding | `0 var(--space-3)` |
| Teks | `body-lg` |

Produksi punya lima varian input yang hampir sama (`custom-input`, tiga varian angka, dan
field pencarian) dengan lebar garis 1px, 1.4px, dan 1.8px. Satu varian saja yang sah di
sini. Field angka tetap boleh rata kanan, tapi memakai border yang sama.

State:

- **Fokus**: border `brand` dan outline `border-width-strong` `brand` offset 2px. Varian
  `flat` Vuetify yang dipakai produksi tidak menggambar garis fokus sendiri, jadi ini
  harus ditulis manual (temuan 12).
- **Galat**: border `error-solid`, radius tidak berubah, pesan di bawah field dengan gaya
  `caption` warna `error-text`. Produksi memindah radius dari 5px ke 8px saat bergalat,
  sehingga kotaknya bergeser bentuk (temuan 9).
- **Nonaktif**: latar `canvas-alt`, teks `text-disabled`.

Ikon di dalam field (kaca pembesar untuk pencarian, mata untuk kata sandi) berukuran 20px
warna `text-secondary`, dengan jarak `space-3` dari tepi. Ikon mata adalah tombol, jadi
harus bisa menerima fokus dan punya label pembaca layar.

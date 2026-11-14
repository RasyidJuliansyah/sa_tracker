# DataTable

Tabel data halaman daftar dan laporan.

| Bagian | Nilai |
|---|---|
| Header | Latar `canvas-table`, tinggi `table-header-height`, gaya `body-strong` |
| Baris | Tinggi `table-row-height`, gaya `body`, padding `0 var(--space-4)` |
| Pemisah | `border-width` `border-subtle` |
| Baris terpilih | Latar `brand-soft` |
| Footer | Tinggi 62px, berisi pemilih jumlah baris dan navigasi halaman |

Pembungkus tabel memakai `overflow-x: auto`, sehingga tabel lebar digeser horizontal di
layar sempit, bukan dipotong. Di 375px tabel selebar 764px tampil dalam jendela 335px dan
halaman tidak meluap.

Kolom Aksi berada paling kiri dan berisi tombol kebab. Status ditampilkan dengan Chip,
bukan tombol kecil (temuan 6).

Angka bermakna di kolom nilai memakai warna: rata-rata `info-text`, tertinggi
`success-text`, terendah `error-text`, semuanya 14px bobot 600. Warna tidak boleh jadi
satu-satunya pembeda, jadi judul kolomnya harus eksplisit.

Label footer di produksi masih bawaan Vuetify dalam bahasa Inggris (`Items per page`,
`1-5 of 5`) di tengah antarmuka yang seluruhnya berbahasa Indonesia. Setel locale Vuetify
ke `id` (temuan 13).

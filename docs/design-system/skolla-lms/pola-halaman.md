# Pola halaman

Susunan yang berulang di sepuluh halaman yang diamati. Setiap halaman baru sebaiknya
mengambil salah satunya, bukan menyusun ulang dari nol.

## Halaman daftar

Terbaca di `/siswa` dan `/bahan-ajar`:

1. Judul halaman di kiri atas, dengan satu baris subjudul penjelas
2. Kartu putih berisi judul seksi di kiri dan tombol aksi di kanan, urutannya tombol
   outline dulu lalu tombol isi
3. Baris filter berisi field pencarian berikon kaca pembesar dan satu atau beberapa select
4. Tabel data dengan kolom Aksi paling kiri berisi tombol kebab
5. Footer tabel berisi jumlah baris per halaman dan navigasi

Dua halaman ini belum seragam. `/siswa` punya subjudul, `/bahan-ajar` tidak. Pencarian di
`/siswa` berada di baris sendiri di bawah judul kartu, di `/bahan-ajar` sebaris dengan
judul kartu. Pilih satu: subjudul selalu ada, pencarian selalu di baris filter sendiri.

## Form

Terbaca di `/form-bahan-ajar`:

1. Header berisi panah kembali dan judul, tanpa kartu
2. Label di atas field, gaya `body`, tanda wajib isi berupa asterisk `error-solid`
3. Field `control-input` dengan border `border` dan radius `radius-sm`
4. Field berpasangan diletakkan dua kolom, misalnya tanggal dan jam
5. Pilihan tunggal memakai radio inline setinggi 40px dengan ikon 24px
6. Unggahan berupa kartu berbingkai radius `radius-md` tinggi 75px berisi tombol tonal di
   tengah
7. Footer tombol rata kanan: Kembali (tonal) lalu Simpan (isi), keduanya `control-md`

## Halaman laporan

Terbaca di rapor, proctoring, dan presensi:

1. Judul dan subjudul, kadang dengan panah kembali di kiri
2. Deretan kartu statistik di atas
3. Banner informasi opsional berlatar `info-surface` dengan tautan aksi di kanan
4. Kartu tabel dengan pencarian dan tombol ekspor
5. Empty state bergambar ilustrasi dengan teks "Data tidak ditemukan"

Kolom nilai memakai warna sebagai penanda makna: rata-rata `info-text`, nilai tertinggi
`success-text`, nilai terendah `error-text`, semuanya 14px bobot 600. Warna saja tidak
cukup; sertakan label kolom yang jelas.

## Dasbor

Sidebar kiri tetap, konten kanan berisi dua kartu grafik berdampingan, lalu kartu daftar
peringkat dengan avatar inisial, nama, keterangan kelas, dan angka nilai di kanan. Filter
tahun ajaran dan kelas di kanan atas. Kartu metrik yang kosong menampilkan tanda hubung,
bukan nol.

## Form login

Satu kolom di tengah selebar sekitar 420px: logo, judul, subjudul, dua field berlabel di
atas input, tautan bantuan rata kanan, lalu tombol blok `brand`. Field kata sandi punya
tombol mata. Placeholder memakai pola "Masukkan ...".

## Empty state

Ikon berlatar lingkaran `accent-surface`, judul "Belum ada data", dan satu kalimat
penjelas yang menyebutkan kapan data akan muncul. Dua kalimat itu beda tugas: judul
menyatakan keadaan, kalimat di bawahnya memberi tahu apa yang harus terjadi supaya
kosongnya hilang.

## Header aplikasi

Tinggi `header-height`, fixed, latar `surface`, garis bawah 1px, `z-index: 1000`. Logo di
kiri, avatar bundar berborder 4px `brand` dan nama serta peran pengguna di kanan.

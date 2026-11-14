# Temuan audit

25 ketidakkonsistenan yang terukur di produksi pada 10 November 2026, beserta usul
perbaikannya. Nomor di sini dipakai sebagai rujukan di catatan token dan guideline
komponen.

| # | Temuan | Dampak | Usul |
|---|---|---|---|
| 1 | Tema Vuetify masih nilai bawaan, warna merek hidup di kelas kustom | Komponen dengan `color="primary"` tampil `#1867C0` | Setel tema ke `brand` |
| 2 | Chip memakai `#2196F3` dari palet Vuetify | Biru ketiga masuk tanpa alasan | Petakan ke `info-text` |
| 3 | Sekitar 1.250 utilitas satu piksel sekali langkah | Tidak ada skala spacing yang mengikat | Pakai skala `space-1` sampai `space-12` |
| 4 | Delapan abu garis yang hampir sama | Garis tidak konsisten antarhalaman | Pakai `border` dan `border-subtle` saja |
| 5 | Penamaan warna bercampur tiga gaya, termasuk akhiran `new` | `primarynew` menyesatkan begitu ada warna lebih baru | Nama semantik jadi kanonik, nama lama jadi alias |
| 6 | Status jadi chip di satu halaman dan tombol kecil di halaman lain | Elemen yang bukan aksi tampak bisa ditekan | Chip satu-satunya cara menampilkan status |
| 7 | Warna sidebar aktif tidak ada di palet | Biru merek bertambah tanpa token | Jadikan `brand-strong` dan `brand-softer` |
| 8 | Bobot tombol isi 500, tombol outline 600 | Dua tombol bersebelahan beda berat huruf | Bobot 600 untuk keduanya |
| 9 | Radius input berubah 5px ke 8px saat bergalat | Bentuk kotak bergeser saat validasi gagal | Radius tetap, ubah warna border saja |
| 10 | State galat memakai kata kunci CSS `red` | Merah galat jadi dua versi | Pakai `error-solid` di semua state galat |
| 11 | Kontras chip 2.10 dan 3.12 pada teks 12px | Status dan tipe konten sulit dibaca | Pakai token `-text` untuk huruf chip |
| 12 | Tidak ada indikator fokus di tombol ikon dan field | Navigasi keyboard tak bisa diikuti | `:focus-visible` 2px `brand`, offset 2px |
| 13 | Label footer tabel berbahasa Inggris | Campur bahasa di antarmuka Indonesia | Setel locale Vuetify ke `id` |
| 14 | Grafik memakai tiga warna di luar palet mana pun | Grafik terlihat dari sistem lain | Token `chart-1` sampai `chart-5` |
| 15 | Tidak ada skala tipografi bernama | Ukuran teks ad hoc lewat `.font-size-*` | Sepuluh gaya di grup Judul, Teks, Antarmuka |
| 16 | Tidak ada token bayangan | Enam nilai bayangan tersebar | Tiga tingkat `shadow-1` sampai `shadow-3` |
| 17 | Judul halaman dan posisi pencarian beda antarhalaman daftar | Halaman daftar tak terasa satu keluarga | Satu templat halaman daftar |
| 18 | Rute khusus sekolah sejajar dengan rute fitur | Soal arsitektur informasi | Perlu dikonfirmasi apakah masih dipakai |
| 19 | Tombol primer punya dua radius, dua bobot, empat padding | Dua halaman terasa dari produk berbeda | Tiga ukuran tombol dengan nilai pasti |
| 20 | Merah ada empat versi | Status galat tak punya satu warna | Pakai `error-solid` di semua tempat |
| 21 | Chip menarik warna dari dua sistem sekaligus | Satu komponen, dua sumber warna | Semua warna chip dari palet ini |
| 22 | Modul analisis butir soal punya bahasa visual sendiri | Modul baru tak mewarisi token | Jadikan tint kartu metode token, atau kembalikan ke kartu biasa |
| 23 | Teks kode soal rasio 1.9:1 | Metadata soal praktis tak terbaca | Pakai `text-secondary` untuk teks kecil |
| 24 | Token `darkblue_90` memakai garis bawah | Gaya penamaan kelima di satu palet | Satukan konvensi penamaan |
| 25 | Tombol Kembali tonal, tombol sekunder daftar outline | Tak jelas kapan tonal, kapan outline | Satu varian untuk aksi sekunder |

Urutan pengerjaan yang disarankan: temuan 11, 12, dan 23 lebih dulu karena menyangkut
keterbacaan dan bisa selesai dalam hitungan jam. Lalu 19 dan 25, karena tombol paling
sering dilihat dan paling mudah disepakati. Setelah itu 1, 2, 7, 20, dan 21 yang
merapikan sumber warna. Terakhir 3 dan 22 yang memakan waktu paling panjang.

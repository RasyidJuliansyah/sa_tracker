# Chip

Penanda status dan kategori, tinggi 26px, teks `chip`, radius `radius-pill`, padding
`0 10px`.

Chip adalah satu-satunya cara menampilkan status. Halaman Data Siswa sekarang memakai
tombol kecil untuk menampilkan status aktif, sehingga sesuatu yang bukan aksi tampak bisa
ditekan (temuan 6). Chip tidak pernah bisa diklik.

Setiap chip memakai pasangan `-surface` untuk latar dan `-text` untuk huruf. Jangan pakai
`-solid` untuk teks: di produksi chip status memakai `success-solid` pada 12px dengan
rasio 2.10:1, dan chip tipe konten memakai biru Vuetify dengan rasio 3.12:1 (temuan 11
dan 21).

| Peran | Latar | Teks | Contoh isi |
|---|---|---|---|
| Berhasil, aktif | `success-surface` | `success-text` | Aktif, Selesai, Lulus |
| Galat, ditolak | `error-surface` | `error-text` | Tidak Aktif, Gagal |
| Peringatan | `warning-surface` | `warning-text` | Menunggu, Sedang |
| Informasi, kategori | `info-surface` | `info-text` | Video, Dokumen |
| Netral | `canvas-alt` | `text-secondary` | Draf |

Isi chip satu atau dua kata, huruf besar hanya di awal. Kalau status perlu penjelasan
lebih panjang, tempat yang benar bukan chip melainkan kolom tersendiri.

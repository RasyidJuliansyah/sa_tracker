# StatCard

Kartu angka ringkas di atas halaman laporan dan dasbor. Lebar 224px, tinggi 95px, radius
`radius-md`, border `border-subtle`.

Isinya tiga bagian dari kiri ke kanan: ubin ikon 44px radius `radius-md` berlatar
`-surface` sesuai makna metrik, lalu label gaya `caption` warna `text-secondary`, lalu
angka besar 24px bobot 600 yang warnanya mengikuti makna.

Angka yang belum ada ditulis sebagai tanda hubung, bukan nol, karena nol adalah nilai yang
valid dan artinya berbeda dari "belum ada data".

Label ditulis utuh, bukan singkatan. "Siswa Tuntas", bukan "Tuntas". Satuan ikut di
label, bukan di angka, supaya angkanya tetap terbaca sebagai angka.

Warna yang dipakai: `success-*` untuk capaian, `warning-*` untuk yang perlu perhatian,
`error-*` untuk yang gagal, `info-*` untuk hitungan netral. Ikonnya disediakan konsumen.
Jangan pakai warna sebagai satu-satunya penjelasan makna; label harus sudah cukup.

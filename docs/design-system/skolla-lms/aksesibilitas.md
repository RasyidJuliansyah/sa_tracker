# Aksesibilitas

Diukur pada `/bahan-ajar` dan `/siswa`, lebar 1440px, tema light.

## Kontras teks

| Pasangan | Rasio | AA (4.5:1) |
|---|---|---|
| Teks tabel `rgba(0,0,0,.87)` di atas putih | 16.10 | Lolos |
| Header tabel di atas `canvas-table` | 15.43 | Lolos |
| Putih di atas `brand` | 11.72 | Lolos |
| `brand-strong` di atas `brand-softer` | 10.92 | Lolos |
| Item sidebar `#5E6A7C` di atas putih | 5.49 | Lolos |
| Subheader sidebar 11px | 5.74 | Lolos |
| Chip tipe konten `#2196F3` 12px | 3.12 | **Gagal** |
| Chip status `success-solid` 12px | 2.10 | **Gagal** |
| Kode soal `text-disabled` 14px | 1.96 | **Gagal** |

Tiga baris terakhir yang jadi alasan token `-text` ada di sistem ini. Pakai
`success-text`, `error-text`, `warning-text`, `info-text`, dan `accent-text` untuk setiap
huruf berwarna, termasuk di dalam chip. Nilai `-solid` hanya untuk ikon, garis, dan
isian.

Warna yang harus dibedakan dibedakan lewat terang, bukan lewat corak. Di kolom nilai
rapor, selisih rata-rata, tertinggi, dan terendah sebaiknya tidak bersandar pada
merah-hijau saja; tambahkan ikon arah atau label.

## Indikator fokus

Dengan menekan Tab berulang kali, fokus berhenti di tombol ikon tanpa perubahan visual
apa pun. `outline` bernilai `none` dan overlay tombol tetap opacity 0. Field pencarian
juga tidak berubah saat menerima fokus, karena memakai varian `flat` yang tidak
menggambar garis fokus Vuetify.

Penutup minimum, tempel setelah impor token:

```css
:is(a, button, input, select, textarea, [tabindex], .v-btn, .v-chip, .v-list-item):focus-visible,
.v-field:focus-within {
  outline: var(--border-width-strong) solid var(--brand);
  outline-offset: 2px;
}
```

Beberapa komponen Vuetify memakai `<i tabindex="0">` sebagai tombol, misalnya ikon mata
di field kata sandi. Tanpa baris di atas, elemen itu jatuh ke cincin fokus bawaan
peramban yang warnanya di luar palet.

Pengujian ini memakai Tab yang disuntikkan lewat otomasi browser. Hasilnya perlu
diverifikasi sekali lagi dengan keyboard sungguhan sebelum dijadikan dasar perbaikan.

## Yang belum diperiksa

Peran ARIA, label form untuk pembaca layar, urutan fokus di dalam drawer dan dialog,
serta ukuran target sentuh di layar kecil.

## Responsif

| Lebar | Perilaku |
|---|---|
| 1440px | Sidebar permanen 220px, konten di kanannya, dua kartu dasbor berdampingan |
| 375px | Drawer jadi sementara dan dipanggil lewat hamburger, konten penuh, tabel digeser horizontal di dalam pembungkusnya |

Halaman tidak meluap horizontal pada 375px. Saat dimuat ulang di lebar itu, drawer tampil
terbuka dan menutupi konten sampai ditutup; perlu dipastikan apakah itu memang keadaan
awalnya. Lebar tablet belum diuji.

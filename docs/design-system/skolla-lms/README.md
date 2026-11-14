# Skolla LMS

Sistem desain ini merekam tampilan yang benar-benar berjalan di `lms.skolla.online`,
bukan tampilan yang seharusnya ada. Nilainya diambil pada 10 November 2026 lewat
pembacaan CSS terkompilasi, bundel JavaScript, dan computed style di browser, dalam
keadaan login sebagai Administrator.

Dua jenis nilai hidup berdampingan di sini. **Terukur** berarti disalin apa adanya dari
produksi. **Usulan** berarti keputusan konsolidasi yang diambil dari temuan audit dan
masih perlu persetujuan desain. Setiap token usulan diberi tanda di catatan pemakaiannya.

## Apa yang sudah dilihat, dan apa yang belum

Sepuluh dari 60 rute dibuka: `/login`, `/home`, `/siswa`, `/bahan-ajar`, `/bank-soal`,
`/form-bahan-ajar`, dan empat halaman laporan. Itu mencakup dasbor, satu form, dua
halaman daftar, dan empat laporan.

Yang belum diperiksa: modul live teaching, H5P, kuis manual, lembar ujian siswa, dialog
dan modal, toast, tab, breadcrumb, stepper, tampilan untuk peran guru, siswa, dan wali
kelas, serta lebar tablet. Berkas CSS vendor memuat seluruh komponen Vuetify, dan
keberadaannya di berkas bukan bukti bahwa komponen itu dipakai.

## Fondasi teknis

| Aspek | Nilai |
|---|---|
| Framework UI | Vue 3 dengan Vuetify 3, komponen SFC berstyle scoped |
| Grafik | ApexCharts |
| Mode tema | Light saja. Tidak ditemukan pemakaian tema gelap. |
| Tipografi | Rubik dari Google Fonts, bobot 400, 500, 600, 700 |
| Ikon | Material Design Icons via CDN, ditambah ikon gambar untuk sidebar dan widget |
| Gerak | Transisi bawaan Vuetify, `0.28s cubic-bezier(.4, 0, .2, 1)` |

Tema Vuetify masih memakai nilai bawaan (`primary` `#1867C0`), sementara warna merek
hidup di kelas kustom. Tombol utama memakai `brand` `#040ABE`, bukan `primary` Vuetify.
Komponen apa pun yang ditulis dengan `color="primary"` akan tampil biru yang salah
sampai tema diisi dengan token di sistem ini.

## Prinsip

**Garis, bukan bayangan.** Kartu dipisahkan dengan border `border` 1px dan radius 8px di
atas latar `canvas`. Bayangan hanya untuk lapisan yang benar-benar mengambang: drawer,
menu, popover.

**Satu sumber warna.** Produksi menarik warna dari tiga tempat sekaligus: palet kelas
kustom Skolla, tema bawaan Vuetify, dan palet grafik ApexCharts sendiri. Akibatnya ada
tiga biru dan empat merah yang berdekatan. Di sistem ini hanya token berikut yang sah,
dan kelas Vuetify seperti `text-blue`, `text-red`, serta `text-orange` tidak lagi
dipakai.

**Warna penuh untuk bentuk, warna gelap untuk teks.** Setiap peran semantik punya tiga
nilai: `-surface` untuk latar, `-solid` untuk ikon dan garis, `-text` untuk huruf.
Jangan pernah menulis teks dengan nilai `-solid`. Chip status di produksi memakai
`success-solid` pada 12px, rasionya 2.10:1, dan itulah informasi yang paling dicari
orang di tabel.

**Bahasa Indonesia sampai ke footer.** Label bawaan Vuetify di footer tabel masih
berbahasa Inggris (`Items per page`, `1-5 of 5`). Setel locale Vuetify ke `id`.

## Memakai token

Tempel `tokens.css` yang dihasilkan sistem ini, lalu rujuk lewat custom property:

```css
.kartu {
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  color: var(--text);
}
```

Aturan yang mengikat:

- Teks utama `text`, teks sekunder `text-secondary`. `text-disabled` hanya untuk elemen
  nonaktif dan placeholder, tidak boleh membawa informasi apa pun.
- Latar halaman `canvas`, permukaan kartu `surface`, header tabel `canvas-table`.
- Aksi utama `brand`. Aksi destruktif memakai `error-solid` sebagai border dan
  `error-text` sebagai teks.
- Garis cuma dua: `border` untuk kartu, input, dan pemisah; `border-subtle` untuk garis
  halus di kartu statistik.
- Setiap elemen yang bisa menerima fokus wajib punya `:focus-visible` dengan outline
  `border-width-strong` warna `brand` dan offset 2px. Produksi sekarang tidak punya
  indikator fokus sama sekali.

## Tipografi

Produksi tidak punya skala bernama; ukurannya ditentukan ad hoc lewat utilitas
`.font-size-8` sampai `.font-size-150`. Sepuluh gaya di bawah adalah ukuran yang benar-benar
terpakai, dikelompokkan jadi skala. Letter-spacing global `0.1px`, kecuali input `0.15px`
dan tombol yang dipaksa `normal`.

Rubik dimuat dari Google Fonts, jadi tidak ada berkas font di sistem ini. Muat dengan:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap">
```

## Ikonografi

Material Design Icons lewat CDN, ukuran 22px di sidebar dan 24px di kontrol. Ikon anak
di sidebar memakai opacity .7 dan menjadi 1 saat aktif. Modul dasbor memakai ikon gambar
tersendiri di dalam ubin 80 × 80px dengan latar pastel per jenis metrik; ikon itu belum
disalin ke sistem ini, jadi belum ada grup aset. Jangan menggambar ulang ikon atau logo
Skolla dari ingatan, salin berkas aslinya.

## Yang perlu dikonfirmasi

1. Apakah `#040ABE` memang warna merek resmi Skolla. Dokumen ini menyimpulkannya dari
   pemakaian, bukan dari panduan merek.
2. Nama lama berakhiran `new` (`primarynew`, `greennew`, `blacknew`) menyiratkan pernah
   ada migrasi warna. Perlu dipastikan warna lamanya sudah tidak dipakai.
3. Aturan pemetaan warna avatar inisial, yang berganti per baris.
4. Hasil uji fokus keyboard berasal dari Tab yang disuntikkan otomasi browser, jadi perlu
   dicek ulang dengan keyboard sungguhan.

Dua seksi lain di sistem ini: **Aksesibilitas** memuat angka kontras dan temuan fokus,
**Pola halaman** memuat susunan halaman daftar, form, laporan, dan dasbor, dan **Temuan
audit** memuat 25 ketidakkonsistenan terukur beserta usul perbaikannya.

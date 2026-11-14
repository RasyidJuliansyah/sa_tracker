# Design system SA Visit Tracker

Aplikasi ini memakai **design system Skolla LMS** sebagai dasar. Sumber lengkapnya disalin apa adanya ke `docs/design-system/skolla-lms/` (README, `tokens.json`, pola halaman, aksesibilitas, temuan audit, dan panduan delapan komponen). Kalau ada yang bertentangan, folder itu yang menang. File ini menerjemahkannya ke Vuetify 3.

**Susunan layar** mengikuti mockup buatan user di `docs/references/mockups/`. Mockup menentukan apa yang ada di layar dan di mana letaknya. Design system menentukan warna, huruf, ukuran, dan bentuk komponennya. Halaman yang belum punya mockup dibangun dengan pola di `docs/design-system/skolla-lms/pola-halaman.md`.

Design system ini dibaca dari produksi `lms.skolla.online` pada 10 November 2026. LMS itu memakai Vue 3, Vuetify 3, ApexCharts, Material Design Icons, dan Rubik, jadi aplikasi ini memakai fondasi yang sama.

## Prinsip yang dibawa

- **Garis, bukan bayangan.** Kartu putih (`surface`) dengan border 1px `border` dan radius 8px di atas latar `canvas`. Bayangan hanya untuk lapisan mengambang: menu, dropdown, dialog, drawer sementara.
- **Satu sumber warna.** Hanya token di `tokens.json` yang sah. Jangan memakai warna palet Vuetify seperti `color="blue"`, `text-red`, atau `bg-orange`.
- **Warna penuh untuk bentuk, warna gelap untuk teks.** Setiap peran punya `-surface` (latar), `-solid` (ikon, garis, isian grafik), dan `-text` (huruf). Teks tidak pernah memakai `-solid`.
- **Rubik** dari Google Fonts, bobot 400, 500, 600, 700.
- **Bahasa Indonesia** di seluruh antarmuka, termasuk label bawaan Vuetify.
- **Tema terang saja**, sama seperti LMS.

## Jangan ulangi temuan audit LMS

`docs/design-system/skolla-lms/temuan-audit.md` mencatat masalah di LMS produksi. Tiga yang paling mudah terulang di proyek Vuetify baru:

1. **Tema Vuetify dibiarkan bawaan.** Di LMS, `primary` masih `#1867C0` dan warna merek hidup di kelas kustom, sehingga komponen dengan `color="primary"` tampil biru yang salah. Di proyek ini tema diisi token sejak langkah pertama, dan `color="primary"` berarti `brand`.
2. **Label tabel berbahasa Inggris** (`Items per page`, `1-5 of 5`). Setel locale Vuetify ke Bahasa Indonesia.
3. **Warna palet Vuetify dipakai langsung** (`#2196F3` di chip, merah empat versi). Hanya nama warna tema yang boleh dipakai.

## Tema Vuetify

Isi `createVuetify({ theme })` dengan satu tema terang, misalnya bernama `skolla`, dan jadikan default.

| Warna tema Vuetify | Token Skolla | Nilai |
|---|---|---|
| `background` | `canvas` | `#f5f7fc` |
| `surface` | `surface` | `#ffffff` |
| `on-background`, `on-surface` | `text` | `#2d3643` |
| `primary` | `brand` | `#040abe` |
| `on-primary` | `text-on-brand` | `#ffffff` |
| `secondary` | `brand-strong` | `#02219e` |
| `error` | `error-text` | `#b01b13` |
| `success` | `success-text` | `#006f36` |
| `warning` | `warning-text` | `#8a5a00` |
| `info` | `info-text` | `#00548d` |

Warna tambahan didaftarkan di tema dengan nama yang sama seperti token, supaya bisa dipakai lewat `color="..."` atau kelas `bg-...` dan `text-...`: `brand-soft`, `brand-softer`, `canvas-alt`, `canvas-table`, `border`, `text-secondary`, lalu `success-surface`, `success-solid`, dan pola yang sama untuk `error`, `warning`, `info`, `accent`, serta `chart-1` sampai `chart-5`.

Warna semantik bawaan Vuetify (`error`, `success`, `warning`, `info`) dipetakan ke token **`-text`**, bukan `-solid`. Alasannya, Vuetify memakai warna yang sama untuk huruf pesan galat di input dan untuk latar tombol berisi. Contohnya merah: teks putih di atas `error-solid` hanya 4,20:1, di bawah batas 4,5:1 untuk teks kecil, sedangkan di atas `error-text` 6,97:1. Warna `-solid` tetap tersedia untuk ikon, garis, dan isian grafik lewat nama tambahannya.

Teks putih di atas keempat warna itu lolos 4,5:1: `success-text` 6,31:1, `warning-text` 5,93:1, `info-text` 7,92:1, `error-text` 6,97:1. Vuetify memilih warna `on-` secara otomatis berdasarkan kecerahan, jadi tulis `on-success`, `on-warning`, `on-info`, dan `on-error` sebagai `#ffffff` secara eksplisit supaya tidak bergeser.

## Default komponen

Atur lewat opsi `defaults` di `createVuetify`, supaya tidak perlu menulis ulang prop di setiap komponen.

| Komponen | Default | Sumber aturan |
|---|---|---|
| `VBtn` | `rounded="pill"`, huruf 600, tanpa huruf kapital semua, `flat` | `components/Button.md` |
| `VCard` | `flat`, `border`, `rounded="lg"` (8px) | `components/Card.md` |
| `VChip` | `rounded="pill"`, `size` setinggi 26px, pasangan `-surface` dan `-text` | `components/Chip.md` |
| `VTextField`, `VSelect`, `VAutocomplete`, `VTextarea` | `variant="outlined"`, `density` yang menghasilkan tinggi 42px, label di atas | `components/Input.md` |
| `VDataTable` | Header berlatar `canvas-table` 47px, baris 52px, footer berbahasa Indonesia | `components/DataTable.md` |
| `VNavigationDrawer` | Lebar 220px, item aktif teks `brand-strong` di atas `brand-softer` | `components/Sidebar.md` |
| `VAppBar` | Tinggi 70px, `flat`, garis bawah `border` | `README.md` |

Beberapa nilai tidak tersedia sebagai prop Vuetify dan perlu diatur lewat variabel SASS Vuetify (berkas `settings.scss`) atau CSS: radius input 5px, tinggi chip 26px, dan garis fokus. `Input.md` mencatat bahwa varian `flat` yang dipakai LMS tidak menggambar garis fokus, jadi setiap elemen yang bisa difokus wajib punya outline `focus-visible` 2px `brand` dengan offset 2px.

## Komponen yang tidak ada di Vuetify

- **StatCard**: komponen sendiri di atas `VCard`. Ubin ikon 44px berlatar `-surface`, label `caption`, angka 24px bobot 600. Data kosong ditulis "–", bukan 0. Lihat `components/StatCard.md`.
- **EmptyState**: komponen sendiri. Ikon di lingkaran `accent-surface` 72px, judul keadaan, satu kalimat tentang apa yang harus terjadi. Lihat `components/EmptyState.md`.
- **Chip perubahan angka** (naik atau turun): `VChip` dengan `success-surface` + `success-text` untuk naik dan `error-surface` + `error-text` untuk turun, selalu dengan ikon panah dan tanda + atau −, supaya makna tidak hanya dibawa warna.

## Grafik

ApexCharts, sama seperti LMS, lewat paket pembungkus Vue 3-nya. Warna seri diambil dari `chart-1` sampai `chart-5` (`#8c7bff`, `#71dd8c`, `#7eb6ff`, `#f2af17`, `#eb3123`), huruf grafik Rubik, dan label sumbu serta tooltip dalam Bahasa Indonesia. Jangan memakai palet bawaan ApexCharts. `README.md` mencatat palet grafik ApexCharts di LMS ikut menambah warna di luar token.

## Ikon

Material Design Icons, sama seperti LMS. Pasang dari paket npm, bukan CDN, supaya aplikasi tetap jalan di jaringan internal dan versinya terkunci. Ukuran 20px di tombol dan input, 22px di sidebar.

## Ukuran dan bentuk

- Radius: 8px untuk kartu, 5px untuk input, pill untuk tombol dan chip.
- Spasi mengikuti skala `space-1` sampai `space-12` (4px sampai 48px). Padding kartu 24px, jarak antarkartu 32px.
- Sidebar 220px, header 70px.

## Format angka

- Rupiah ditulis `Rp 156.841.000` di tabel dan detail, dan boleh diringkas `Rp 156,8 jt` di StatCard, dengan nilai penuh di tooltip.
- Persentase satu angka desimal dengan koma: `39,6%`.
- Durasi `1 j 25 m`.
- Pakai `Intl.NumberFormat("id-ID")` lewat satu helper bersama, jangan memformat manual di komponen.

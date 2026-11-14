# Spesifikasi layar: Dashboard manager

Status: draf 3, dari mockup HTML buatan user. Semua keputusan sudah diambil.

## Sumber dan cara pakai

- Mockup asli: `manager-dashboard.html` di folder ini. File itu dibuat dengan Tailwind lewat CDN, gambar dari URL luar, dan ikon Material Symbols.
- **Mockup adalah acuan tampilan, bukan kode untuk disalin.** Proyek ini memakai Vuetify 3 tanpa Tailwind. Jangan menyalin kelas Tailwind, konfigurasi `tailwind.config`, atau warna dari blok konfigurasi itu ke kode Vue. Terjemahkan setiap bagian ke komponen Vuetify dan token di `docs/design-system.md`.
- Lebar acuan: **1440px**, desktop. Mockup ini tidak punya versi tablet atau HP; dashboard manager memang dipakai di laptop.
- Untuk perbandingan visual, render `manager-dashboard.html` dengan Playwright di lebar 1440px (butuh internet untuk CDN Tailwind, font, dan gambar). Bagian yang sengaja diubah di spesifikasi ini akan tampak berbeda dari mockup; itu bukan kesalahan.

## Kerangka halaman

| Bagian | Ukuran dan isi | Vuetify |
|---|---|---|
| Sidebar | Lebar 220px, putih, garis kanan `border`. Atas: logo Skolla dan teks "Service Account Tracker" (tinggi 70px, garis bawah). Lalu label grup "Navigasi utama" dan enam menu. Bawah: versi aplikasi dan titik status | `VNavigationDrawer` permanen |
| Menu manager | Dashboard, Data Sekolah & Kontrak, Rekap Kunjungan, Penugasan & Target, Kelola Akun Agent, Audit Log. Item aktif: teks `brand-strong` di atas `brand-softer`, radius 8px | `VList` + `VListItem` |
| Header | Tinggi 70px, putih, garis bawah. Kanan: chip zona waktu pengguna ("WIB • UTC+7"), pemisah, nama dan peran pengguna, avatar inisial | `VAppBar` flat |
| Konten | Latar `canvas`, padding 24px, jarak antarbagian 24px di mockup (design system: 32px, lihat Selisih) | `VMain` + `VContainer fluid` |

## Bagian konten, urut dari atas

**1. Baris filter.** Kartu satu baris. Kiri: label "Filter agent" dan pilihan agent selebar minimal 240px, setinggi 42px, ikon grup di kiri. **Bisa memilih beberapa agent sekaligus** (`VAutocomplete` dengan `multiple` dan chip), berbeda dari mockup yang hanya satu. Default "Semua agent (N agent)". Setiap pilihan menampilkan nama dan zona waktu agent. Jika lebih dari dua agent dipilih, chip diringkas menjadi "Armin A., Mikasa A. +2" supaya baris tidak melebar. Seluruh isi dashboard mengikuti pilihan ini. Tombol "Unduh ringkasan" dan "Kustomisasi kolom" di kanan tidak dipakai di MVP.

**2. Judul dan periode.** Judul "Dashboard Aktivitas & Retention Agent" (24px, 600) dengan satu kalimat keterangan di bawahnya yang menyebut waktu acuan WIB. Kanan: segmented control Hari / Minggu / Bulan (pill, item aktif berlatar `brand`, teks putih) dan navigasi periode (tombol sebelumnya, ikon kalender, rentang tanggal "1 Nov – 30 Nov 2026 (WIB)", tombol berikutnya).

**3. Angka utama dan empat StatCard.** Grid 12 kolom, jarak 24px.
- Kartu retention (4 kolom), **tahunan, tidak ikut pilihan periode**: label "Retention 2026", angka besar 32px bobot 700 = nilai perpanjangan yang sudah ditandatangani untuk kontrak kohort 2026, chip label status (Sesuai target / Di bawah target / Belum ada data). Di bawah garis: baris "Target minimal: Rp … (65% dari Rp … nilai kontrak berakhir 2026)" dengan persentase retention di kanan, progress bar 10px yang diberi tanda di titik target, dan baris kecil "Dari kontrak yang sudah diputuskan: …%" sebagai dasar label status. Rumus di `docs/PLAN.md` bagian Retention dan target.
- Empat StatCard (8 kolom, masing-masing 2 kolom): **Perpanjangan periode ini** (nilai perpanjangan yang ditandatangani pada periode yang dipilih, jumlah kontraknya, dan chip perubahan dibanding periode sebelumnya), Kunjungan selesai, Sekolah dikunjungi, Rata-rata durasi. Masing-masing: label 12px di kiri atas, ikon 20px di kanan atas, angka 20px bobot 700 dengan satuan kecil, satu baris keterangan 13px, dan chip di bawah.

**4. Kontribusi retention per agent.** Kartu penuh. Judul (18px, 600), keterangan, dan tombol tonal "Lihat rincian penugasan" ke halaman Penugasan & Target. Bar tersegmentasi setinggi 16px menunjukkan porsi setiap agent dari total nilai perpanjangan yang sudah ditandatangani untuk kohort tahun berjalan, satu warna `chart-1` sampai `chart-5` per agent. Di bawahnya legenda empat kolom: titik warna, nama singkat dengan persentase porsi, dan nominal.

**5. Dua kolom (7 : 5).**
- Kiri, tren aktivitas: judul, keterangan, dan tab Perpanjangan / Kunjungan / Durasi. Baris ringkasan rata-rata dan puncak. Grafik area setinggi sekitar 224px dengan garis `brand-strong` dan isian gradasi, titik puncak ditandai dan diberi tooltip. Dibuat dengan ApexCharts, bukan SVG tangan seperti di mockup. Di bawah grafik: kotak "Kesesuaian penugasan" (bar dua segmen: ditugaskan dan di luar penugasan) dan kotak peringatan sekolah yang belum dikunjungi.
- Kanan, peringkat agent (**kartu, sesuai mockup**): judul, keterangan, chip jumlah agent aktif. Daftar kartu per agent, urut persentase retention dari tertinggi: nomor peringkat, avatar inisial, nama, chip zona waktu, ringkasan "48 kunjungan • 12 sekolah • 1 j 35 m", nilai perpanjangan yang sudah ditandatangani, persentase retention dengan nilai kontrak kohortnya ("95,3% dari Rp 220 jt"), label status, dan progress bar 6px bertanda di titik 65%. Agent tanpa kontrak di kohort tahun ini menampilkan "–". Klik kartu untuk membuka atau menutup rincian: kontrak kohort sekolah-sekolahnya, masing-masing dengan nilai kontrak, nilai perpanjangan (atau "Belum diperpanjang" dan tanggal berakhirnya), dan retention per sekolah. Hanya satu kartu terbuka dalam satu waktu. Kartu yang terbuka diberi border `brand` dan latar `brand-softer` tipis. Kartu harus bisa dibuka dengan keyboard (Enter atau Spasi) dan memakai `aria-expanded`.

**6. Aktivitas kunjungan terbaru.** Kartu tabel dengan tautan "Buka semua di Rekap Kunjungan". Kolom: Waktu & tanggal, Agent, Sekolah (nama + NPSN dan provinsi), Check-in / check-out, Durasi, Status, Aksi. Header tabel `canvas-table`. Kolom waktu menampilkan jam dalam zona agent, dan untuk agent di luar WIB ditambah baris kecil berisi padanan WIB-nya. Baris kunjungan yang masih berlangsung diberi latar `brand-softer` tipis.

## Selisih dengan design system (dikoreksi otomatis)

Aturanmu: desain mengikuti token Skolla. Jadi bagian berikut diikuti design system, bukan mockup.

| Di mockup | Dikoreksi menjadi | Alasan |
|---|---|---|
| `primary` `#000282`, `on-surface` `#131c28`, `background` `#f8f9ff`, `on-surface-variant` `#454555`, dan warna Material lain di konfigurasi | `brand`, `text`, `canvas`, `text-secondary` | Bukan token Skolla; berasal dari palet bawaan tool pembuat mockup |
| `success-solid` `#71dd8c`, `success-text` `#1b7a37`, `warning-text` `#9a6500` | `success-solid` `#00cf3f`, `success-text` `#006f36`, `warning-text` `#8a5a00` | Nilai di mockup berbeda dari `tokens.json`; `#71dd8c` sebenarnya `chart-2` |
| Chip hijau `#d4f7dc`/`#0e6229` dan chip kuning `#fff4db` | `success-surface` + `success-text`, `warning-surface` + `warning-text` | Warna di luar token |
| Tombol, segmented aktif, dan progress bar berwarna `brand-strong` | `brand` | Design system: aksi utama memakai `brand`; `brand-strong` untuk teks item aktif |
| Inisial putih di avatar berwarna `chart-1` sampai `chart-4` | Inisial `text` di atas `-surface` yang sepadan, atau warna inisial gelap | Kontras 1,69 sampai 3,29, di bawah 4,5:1 |
| Angka peringkat 1 `warning-text` di atas `chart-4` 20% | `warning-text` di atas `warning-surface` | Kontras 4,35, di bawah 4,5:1 |
| Jam dan durasi memakai font monospace | Rubik dengan `font-variant-numeric: tabular-nums` | Design system hanya memakai Rubik; angka tetap rata |
| Teks 10px (chip zona waktu, sumbu grafik) | Minimal 11px (`sidebar-subheader`) atau 12px (`caption`) | Tidak ada ukuran 10px di design system |
| Radius input dan item menu 4px | Input 5px, item sidebar 8px | `radius-sm` dan `radius-md` |
| Jarak antarkartu 24px | 32px (`space-8`) | Kecuali kamu memilih tetap 24px, lihat keputusan 6 |
| Ikon Material Symbols | Material Design Icons dengan padanan terdekat | Pustaka ikon proyek |
| Label bahasa Inggris: "SA Live Ops", "On-track", "Top Retention", "High Consistency", "Live" | Bahasa Indonesia, atau dihapus jika tidak punya aturan (lihat keputusan 2 dan 5) | Seluruh antarmuka berbahasa Indonesia |
| Logo dan foto profil dari URL luar | File logo Skolla asli di repo; avatar inisial | Gambar mockup hanya contoh dan tidak boleh dimuat dari luar |
| Teks "Skolla LMS v2.4" di sidebar | Nama dan versi aplikasi ini dari `package.json` | Teks contoh |

## Selisih dengan PLAN.md

**1. Kartu utama diubah dari revenue menjadi retention (dikoreksi).** Mockup menampilkan revenue November (Rp 528.976.000) dibanding target Rp 674.000.000 dan menghasilkan 78,5%. Rumus yang disepakati berbeda: dasar target adalah nilai kontrak klien yang kontraknya berakhir di tahun berjalan, yang dihitung adalah nilai perpanjangan yang sudah ditandatangani, dan targetnya 65%. Pencatatan revenue per transaksi juga dipindah ke Fase 2. Karena itu kartu utama, StatCard pertama, bar kontribusi, peringkat agent, dan tab grafik memakai nilai kontrak dan perpanjangan, bukan revenue tercatat.

**2. Fitur di luar MVP, dikeluarkan dari layar kecuali kamu memasukkannya ke MVP:**
- Kolom pencarian global dan lonceng notifikasi di header.
- Garis "Target harian (5)" di grafik dan chip "Ideal > 60 m / visit". Target jumlah kunjungan ada di Fase 2, dan durasi ideal belum punya aturan.
- Tombol "Pantau live", titik real-time yang berkedip, dan status "Selesai (Valid)". Pemantauan langsung dan validasi lokasi (geofence) bukan bagian MVP. Diganti tombol "Lihat detail" dan status "Selesai" atau "Berlangsung".
- Tombol "Tugaskan / Jadwalkan" menjadi "Tugaskan". Jadwal kunjungan ada di Fase 3.

**3. Definisi angka yang diperjelas.**
- "Sekolah dikunjungi 38 / 41": 38 = sekolah ditugaskan yang dikunjungi pada periode itu, 41 = semua sekolah yang sedang ditugaskan. Label "Cakupan wilayah" diganti "Cakupan sekolah binaan", karena yang dihitung sekolah, bukan wilayah.
- "Kesesuaian penugasan": label "Luar kuota" diganti "Di luar penugasan".
- Agent tanpa perpanjangan tetap tampil di bar kontribusi dan peringkat dengan "Rp 0", supaya jumlahnya cocok dengan filter. Di mockup, filter menyebut 5 agent tetapi bar dan peringkat hanya menampilkan 4.

## Keputusan

- Peringkat agent: kartu seperti mockup, bisa dibuka untuk rincian. (2026-11-14)
- Filter agent: bisa memilih beberapa agent sekaligus. (2026-11-14)
- Tombol "Unduh ringkasan" dan "Kustomisasi kolom": tidak dipakai di MVP. Ekspor data tetap ada di halaman masing-masing sebagai CSV.

- Kartu utama dan peringkat memakai retention: nilai perpanjangan ÷ nilai kontrak yang berakhir di tahun berjalan, target 65%. (2026-11-14)
- Label status: dua tingkat, "Sesuai target" dan "Di bawah target", dihitung dari kontrak yang sudah diputuskan, plus "Belum ada data". (2026-11-14)

## Langkah berikutnya

Buat `manager-dashboard.v2.html`: salinan mockup dengan semua koreksi di spesifikasi ini, sebagai acuan perbandingan visual Playwright.

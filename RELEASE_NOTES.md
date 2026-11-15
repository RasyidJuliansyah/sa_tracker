# SA Visit Tracker v0.1: rilis pertama

14 November 2026

Mulai sekarang kunjungan ke sekolah dicatat langsung dari HP, laporan masuk saat itu juga, dan manager bisa memantau semuanya di satu tempat.

## Sorotan

- **Agent mencatat kunjungan dari HP dalam dua langkah.** Check-in dengan foto dan lokasi, lalu check-out dengan laporan. Jam dicatat oleh server, jadi tidak bisa diubah dari HP.
- **Manager melihat semua agent sekaligus.** Dashboard menampilkan aktivitas hari ini, minggu ini, dan bulan ini dibanding periode sebelumnya, serta peringkat agent dan kontrak yang perlu ditindaklanjuti.
- **Retention tahunan dan target ada di dashboard.** Perpanjangan kontrak yang sudah ditandatangani dibanding target tahun itu, untuk seluruh tim maupun per agent.

## Fitur baru

### Untuk agent
- **Check-in dan check-out.** Pilih sekolah, ambil foto, dan lokasi terbaca otomatis. Check-out wajib berisi laporan, jadi tidak ada kunjungan yang berhenti tanpa catatan. Satu agent hanya bisa punya satu kunjungan berlangsung.
- **Check-in di sekolah mana saja.** Sekolah yang tidak ditugaskan kepada Anda tetap bisa dikunjungi dan tercatat.
- **Beranda pribadi.** Ringkasan kunjungan, retention sekolah Anda, sekolah yang belum dikunjungi, dan kontrak yang perlu perhatian.
- **Sekolah saya.** Data sekolah, kontrak berjalan, riwayat kontrak, dan laporan kunjungan Anda ke sekolah itu.
- **Riwayat kunjungan** dengan filter minggu ini dan bulan ini.

### Untuk manager
- **Dashboard** dengan pilihan hari, minggu, dan bulan (dihitung dalam WIB), filter per agent, grafik, dan rincian per agent.
- **Rekap kunjungan** dengan filter tanggal, agent, sekolah, dan status, beserta halaman detail yang menampilkan laporan, lokasi, dan foto.
- **Data sekolah dan kontrak.** Tambah sekolah beserta kontrak pertamanya, catat perpanjangan, lihat riwayat kontrak, dan lihat riwayat perubahan tiap sekolah.
- **Penugasan.** Tugaskan atau pindahkan sekolah ke agent. Penugasan lama tersimpan di riwayat, dan retention sekolah ikut agent yang sedang menanganinya.
- **Target retention per tahun.** Standarnya 65% dan bisa diubah per tahun.
- **Impor dan ekspor CSV.** Impor data sekolah dengan pratinjau baris yang valid dan yang gagal sebelum disimpan. Ekspor data sekolah, riwayat kontrak, dan rekap kunjungan sesuai filter.
- **Kelola akun agent** dan **audit log**.

### Untuk admin
- **Akun.** Tambah akun dengan password sementara, ubah peran dan zona waktu, reset password, dan nonaktifkan akun. Akun tidak dihapus supaya riwayat kunjungannya tetap utuh.
- **Master jenjang dan paket**, yang juga dipakai untuk mencocokkan impor CSV.
- **Audit log** semua perubahan penting, termasuk login, impor, dan ekspor.

## Keamanan dan keandalan

- Hanya email yang didaftarkan admin dan masih aktif yang bisa masuk.
- Setiap peran hanya melihat yang menjadi haknya. Agent hanya melihat kunjungan dan sekolah yang ditugaskan kepadanya, dan nilai kontrak sekolah lain tidak terlihat.
- Reset password langsung mengeluarkan sesi lama yang masih terbuka.
- Percobaan login dibatasi untuk menahan tebak-tebakan password.
- Foto kunjungan hanya bisa dibuka oleh orang yang berhak, dan disimpan di luar folder yang bisa diakses publik.
- File ekspor aman dibuka di Excel: isi sel yang berbentuk rumus dinetralkan.
- Setiap perubahan data tercatat siapa, kapan, dan nilai sebelum dan sesudahnya.

## Yang perlu diketahui

- **Belum diuji di HP sungguhan.** Kamera dan GPS baru bisa jalan lewat alamat HTTPS di server. Pengujian di perangkat nyata dilakukan sebelum dipakai seluruh tim.
- **Tidak ada layar ganti password sendiri.** Password hanya diatur ulang oleh admin. Admin menyerahkan password sementara kepada pengguna.
- **Foto menyimpan metadata asli.** Lokasi di dalam berkas foto (EXIF) belum dibuang. Keputusannya masih menunggu.
- **Beranda agent:** tombol panah untuk berpindah periode belum berfungsi.
- **Halaman sekolah:** tab Kunjungan belum menampilkan daftar kunjungan sekolah itu.
- **Daftar besar:** daftar sekolah dimuat sampai 200 baris per layar. Cukup untuk saat ini, tetapi perlu ditingkatkan bila jumlah sekolah jauh lebih banyak.
- **Hak admin:** admin dapat melihat data kunjungan, termasuk lokasi dan foto, sama seperti manager.

## Segera hadir

- Perpindahan periode di Beranda agent.
- Daftar kunjungan di halaman sekolah.
- Penyempurnaan foto dan pembersihan metadata.

## Masukan

Temukan sesuatu yang aneh, atau ada yang kurang? Kirim ke tim produk dengan menyebut layar dan langkah yang Anda lakukan, supaya mudah ditelusuri.

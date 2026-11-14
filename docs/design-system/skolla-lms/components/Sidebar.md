# Sidebar

Navigasi utama, lebar `sidebar-width` 220px, tinggi penuh layar, latar `surface`.

| Bagian | Nilai |
|---|---|
| Item | Padding `7px 0 7px var(--space-3)`, gaya `body-strong`, warna `text-secondary`, gap ikon 20px, radius `radius-md` |
| Item aktif | Teks `brand-strong`, latar `brand-softer` |
| Subheader grup | Gaya `sidebar-subheader`, warna `text-secondary`, tinggi minimum 28px |
| Pohon submenu | Garis vertikal putus-putus `border` di `left: 19px` |
| Pemisah | `border-width` `border`, margin `10px 10px 4px` |
| Ikon | 22px, opacity .7, jadi 1 saat aktif |

Scrollbar disembunyikan. Di layar sempit drawer jadi sementara dan dipanggil lewat tombol
hamburger di header.

Produksi memakai `#5E6A7C` untuk item dan `#02219E` dengan latar `#ECF2FF` untuk item
aktif, tiga warna yang tidak ada di palet mana pun (temuan 7). Di sini item memakai
`text-secondary` dan state aktifnya memakai `brand-strong` di atas `brand-softer`, yang
rasionya 10.92:1.

Item aktif tidak boleh dibedakan dari latarnya saja. Tanda aktif ada dua: latar
`brand-softer` dan warna teks `brand-strong`, jadi orang yang tidak membedakan biru muda
dari putih masih bisa membacanya dari bobot warnanya.

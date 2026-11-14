# EmptyState

Tampilan saat daftar atau tabel tidak punya isi.

Tiga bagian, rata tengah: ikon di dalam lingkaran `accent-surface` berdiameter 72px,
judul gaya `card-title`, lalu satu kalimat gaya `body` warna `text-secondary`.

Judul menyatakan keadaan, kalimatnya memberi tahu apa yang harus terjadi supaya kosongnya
hilang. "Belum ada data" sendirian tidak membantu; "Belum ada bahan ajar" diikuti
"Bahan ajar akan muncul di sini setelah guru mengunggah materi pertamanya" membantu.

Bedakan dua keadaan yang di produksi sekarang terlihat sama:

- **Belum ada isi** — judul "Belum ada ...", kalimat penjelas, dan kalau ada aksi yang
  bisa dilakukan pengguna, satu tombol `filled`.
- **Pencarian tidak menemukan apa-apa** — judul "Data tidak ditemukan", kalimat yang
  menyebut kata kunci yang dicari, dan tombol `outline` untuk menghapus filter.

Jangan memakai ilustrasi besar untuk hasil pencarian kosong; itu keadaan sementara yang
akan sering dilihat orang yang sama.

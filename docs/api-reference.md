# API Reference

Semua endpoint di bawah `/api`. Sesi lewat cookie httpOnly `sa_session`. Permintaan yang mengubah data wajib membawa header `Origin` = `CORS_ORIGIN`. Galat: `{ error: { code, message, details? } }` dengan kode `VALIDATION` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL` (500).

## Auth (B3)
| Metode | Path | Peran | Keterangan |
|---|---|---|---|
| POST | `/auth/login` | publik | `{ email, password }` → `{ user }` + cookie. Dibatasi 10 percobaan/15 menit/IP. |
| POST | `/auth/logout` | publik | 204, cookie dihapus. |
| GET | `/me` | login | `{ user }` |

## Akun (B4)
Akun: `{ id, name, email, role, timezone, status: ACTIVE|MUST_CHANGE_PASSWORD|INACTIVE, lastLoginAt }`.
| Metode | Path | Peran | Keterangan |
|---|---|---|---|
| GET | `/users?query&role&status` | ADMIN, MANAGER | Manager hanya melihat AGENT. |
| POST | `/users` | ADMIN | `{ name, email, role, timezone, password? }` → 201 `{ account, tempPassword }`. Password kosong = dibuat server. |
| PATCH | `/users/:id` | ADMIN, MANAGER | `{ name?, email?, role?, timezone?, isActive? }`. Manager: hanya akun AGENT, tanpa ubah peran/email. Tidak bisa menonaktifkan/mengubah peran diri sendiri. |
| POST | `/users/:id/reset-password` | ADMIN | `{ password? }` → `{ tempPassword }`. |

### Impor/ekspor akun (ADMIN saja)
| Metode | Path | Keterangan |
|---|---|---|
| GET | `/import/accounts/template` | CSV template (`nama,email,peran,zona_waktu,password`) |
| POST | `/import/accounts/preview` | `{ csv }` → `{ rows:[{line,name,email,role,isNew,ok,message}], fileError }`, tanpa menyimpan |
| POST | `/import/accounts/commit` | `{ csv }` → `{ created, updated, failed:[{line,message}] }`. Email yang ada diperbarui (nama/peran/zona waktu saja, email dan password tidak disentuh); baru = akun dengan password sementara. Tidak bisa mengubah akun sendiri lewat impor. Audit CREATE/UPDATE per baris + ringkasan IMPORT. |
| GET | `/export/accounts?role&status&label` | CSV akun (nama, email, peran, zona waktu, status, login terakhir); `dryRun=1` untuk hitung baris |

## Master (B4)
`kind` = `jenjang` atau `packages`. Item: `{ id, name, active, schoolCount }`.
| Metode | Path | Peran |
|---|---|---|
| GET | `/master/:kind` | semua yang login |
| POST | `/master/:kind` `{ name }` | ADMIN |
| PATCH | `/master/:kind/:id` `{ name?, active? }` | ADMIN |

## Audit log (B4)
`GET /audit-logs?entityType&entityId&action&actorId&from&to&page&pageSize` (ADMIN, MANAGER; tanggal yyyy-mm-dd WIB) → `{ total, items: [{ id, at, action, entityType, entityId, actor, actorRole, changes }] }`.

## Sekolah dan kontrak (B5)
Tanggal `yyyy-mm-dd`. AGENT hanya melihat sekolah yang sedang ditugaskan kepadanya (sekolah lain → 404).
Ringkasan sekolah: `{ id, npsn, name, lmsSchoolId, city, timezone, jenjang:{id,name}, package:{id,name}, agent:{id,name,sharePercent}|null, contract:{id,type,previousContractId,signedDate,start,end,value,note}|null, status:{kind: RENEWED|EXPIRED|ENDING_SOON|RUNNING, daysLeft}|null }`.
| Metode | Path | Peran | Keterangan |
|---|---|---|---|
| GET | `/schools?query&jenjangId&packageId&status&agentId(id\|NONE)&page&pageSize` | semua (AGENT: milik sendiri) | `{ total, items }` |
| POST | `/schools` | ADMIN, MANAGER | Sekolah + `contract` pertama wajib (+ `agentId` opsional). NPSN 8 digit unik, ID LMS unik. → 201 detail |
| GET | `/schools/:id` | semua (AGENT: milik sendiri) | `{ school (+alamat, PIC, 4 tanggal), contracts[], assignments[] }` |
| PATCH | `/schools/:id` | ADMIN, MANAGER | Sebagian field sekolah; audit berisi sebelum/sesudah |
| POST | `/schools/:id/contracts` | ADMIN, MANAGER | Perpanjangan: `{ previousContractId, signedDate, start, end, value, note }`. Periode tidak boleh tumpang tindih, satu perpanjangan per kontrak. |
| GET | `/schools/:id/changes` | ADMIN, MANAGER | Riwayat perubahan sekolah dan kontraknya (dari audit log) |

## Penugasan dan target retention (B6)
Peran: ADMIN, MANAGER.
| Metode | Path | Keterangan |
|---|---|---|
| GET | `/assignments` | `{ agents:[{id,name,timezone,schools[]}], unassigned[] }` (ringkasan sekolah seperti B5) |
| PUT | `/schools/:id/assignment` | `{ agentId }`. Tugaskan/pindahkan dalam satu transaksi (tutup baris lama, buat baru, porsi 100); agent yang sama = tanpa perubahan. Batas `MAX_AGENTS_PER_SCHOOL`. Audit ASSIGN/UNASSIGN. |
| GET | `/retention-targets` | `{ items:[{year,targetPercent,isDefault,cohortValue,signedValue,retention,status: NONE\|ON_TARGET\|BELOW}] }` dari modul retention B1 |
| PUT | `/retention-targets/:year` | `{ targetPercent }` (0–100), dikembalikan daftar terbaru |

## Kunjungan (B7)
Kunjungan: `{ id, agentId, agentName, schoolId, schoolName, assigned, timezone, checkInAt, checkOutAt, durationMinutes, status: ONGOING|DONE, report, accuracyM, lat, lng, hasPhoto, plan: { id, purpose, source: SELF|MANAGER } | null }`. Waktu ISO UTC; tampilkan di `timezone` kunjungan.
| Metode | Path | Peran | Keterangan |
|---|---|---|---|
| POST | `/visits/check-in` | AGENT | `multipart/form-data`: `schoolId, lat, lng, accuracy?, photo` (JPEG/PNG/WebP asli, maks 8 MB). Jam dari server, zona agent disalin. Satu kunjungan ONGOING per agent (409 bila ada). **Revisi 15:** hanya sekolah yang ditugaskan atau punya rencana terjadwal hari ini (WIB); selain itu 403. Kunjungan dihubungkan ke rencana terjadwal bila ada (`plan_id`). |
| POST | `/visits/:id/check-out` | AGENT (pemilik) | `{ report }` wajib. 409 bila sudah selesai. |
| GET | `/visits?from&to&agentId&schoolId&status&page&pageSize` | semua (AGENT: milik sendiri) | `{ total, items }`, terbaru dulu. |
| GET | `/visits/:id` | semua (AGENT: milik sendiri; lainnya 404) | `{ visit }` |
| GET | `/visits/:id/photo` | sama | Gambar; `Cache-Control: no-store`, `nosniff`. Satu-satunya jalan ke foto (folder `PHOTO_STORAGE_DIR` di luar publik). |
Audit CHECK_IN/CHECK_OUT hanya memuat `schoolId`, tanpa koordinat. Audit CHECK_IN juga memuat `planId` (atau null).

## Rencana kunjungan (revisi 15)
Rencana: `{ id, agentId, agentName, schoolId, schoolName, npsn, city, planDate (yyyy-mm-dd WIB), purpose, source: SELF|MANAGER, storedStatus: PENDING|APPROVED|REJECTED|CANCELLED, status: PENDING|APPROVED|REJECTED|CANCELLED|DONE|MISSED|EXPIRED, decidedBy, decidedAt, decisionNote, visitId, createdAt }`. `status` adalah status turunan yang ditampilkan (Menunggu persetujuan/Terjadwal/Ditolak/Dibatalkan/Selesai/Terlewat/Kedaluwarsa); `storedStatus` yang tersimpan. Lihat `docs/prd-rencana-kunjungan.md`.
| Metode | Path | Peran | Keterangan |
|---|---|---|---|
| GET | `/visit-plans?from&to&agentId&schoolId&source&upcoming` | semua (AGENT: milik sendiri) | `{ total, items }`, terbaru dulu (maks 500). `upcoming=true` hanya Mendatang, `false` hanya Riwayat. Status turunan difilter di server. |
| POST | `/visit-plans` | AGENT, MANAGER, ADMIN | `{ agentId?, schoolId, planDate, purpose }`. AGENT: `agentId` selalu dirinya. Status awal: manager/admin → Terjadwal; agent+sekolah ditugaskan → Terjadwal; agent+sekolah lain → Menunggu persetujuan. Tanggal hari ini–90 hari, tujuan 5–255 kar. Satu rencana aktif per agent+sekolah+tanggal (409). |
| GET | `/visit-plans/:id` | semua (AGENT: milik sendiri; lainnya 404) | `{ plan }`. |
| POST | `/visit-plans/:id/cancel` | pembuat, MANAGER, ADMIN | Agent hanya membatalkan rencananya sendiri (bukan jadwal dari manager → 403). Rencana yang sudah punya kunjungan → 409. |

Persetujuan/penolakan pengajuan (`/visit-plans/:id/approve|reject`) oleh MANAGER/ADMIN belum diimplementasikan di tahap ini (menyusul di layar manager).

## Dashboard (B8)
Query: `period=day|week|month` (default week), `offset` (0 = periode ini, −1 = sebelumnya). Batas periode dihitung dalam WIB (minggu Senin–Minggu); retention tahunan tidak ikut periode.
| Metode | Path | Peran | Isi |
|---|---|---|---|
| GET | `/dashboard/manager` | ADMIN, MANAGER | `{ today, period, previous, annual:{year,targetPercent,cohortValue,retainedValue,percent,targetValue,decidedValue,decidedRetained,status,breakdown:{renewed,lapsed,pending}}, agents:[{id,name,timezone,schools,retentionPct,status,retainedValue,cohortValue,contributionPct,visits,unvisited}], stats:{current,previous}, chart:{labels,now,before}, attention[], unvisited[] }` |
| GET | `/dashboard/agent` | AGENT | `{ today, period, previous, retention, stats:{current,previous}, unvisited[], attention[] }` hanya data agent itu (sekolah yang sedang ditugaskan) |
`stats.*`: `{ visits, ongoing, schools, completed, durationMinutes, renewalValue, assignedVisits, otherVisits }`. `attention`: kontrak lewat tempo (`lapsed`) atau ≤ 60 hari (`soon`) yang belum diperpanjang. `unvisited`: sekolah bertugas yang tidak dikunjungi siapa pun pada periode terpilih (+ `lastVisitAt`). Perpanjangan per periode dihitung dari tanggal tanda tangan.

## Impor dan ekspor CSV (B9)
Peran: ADMIN, MANAGER. Impor memakai JSON `{ csv }` (teks file, maks 5 MB, 2000 baris). Kolom: `npsn, nama_sekolah, jenjang, paket, zona_waktu, kota, alamat, pic, kontak_pic, id_lms, tanggal_ttd, tanggal_mulai, tanggal_berakhir, nilai_kontrak`.
| Metode | Path | Keterangan |
|---|---|---|
| GET | `/import/schools/template` | CSV template |
| POST | `/import/schools/preview` | `{ rows:[{line,npsn,...,isNew,ok,message}], fileError }`, tanpa menyimpan. Jenjang/paket dicocokkan nama dengan master aktif. |
| POST | `/import/schools/commit` | `{ created, updated, failed:[{line,message}] }`. Satu transaksi per baris; NPSN yang ada diperbarui (kontrak tidak disentuh), baru = sekolah + kontrak pertama. Audit `IMPORT` per baris + ringkasan. |
| GET | `/export/schools?jenjangId&status&label` | CSV UTF-8 BOM, sel `= + - @ tab CR` dinetralkan; audit `EXPORT` |
| GET | `/export/contracts?year&agentId&label` | Riwayat kontrak + retention per kontrak |
| GET | `/export/visits?from&to&agentId&label` | Rekap kunjungan (jam WIB) |
| GET | `/export/log` | 50 ekspor terakhir `{ id, at, actor, kind, filter, rows }` |
Ekspor: `dryRun=1` hanya mengembalikan `{ rows }` tanpa unduhan dan tanpa audit; header `X-Row-Count` pada unduhan.

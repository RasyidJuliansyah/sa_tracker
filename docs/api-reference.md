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

## Master (B4)
`kind` = `jenjang` atau `packages`. Item: `{ id, name, active, schoolCount }`.
| Metode | Path | Peran |
|---|---|---|
| GET | `/master/:kind` | semua yang login |
| POST | `/master/:kind` `{ name }` | ADMIN |
| PATCH | `/master/:kind/:id` `{ name?, active? }` | ADMIN |

## Audit log (B4)
`GET /audit-logs?entityType&entityId&action&actorId&from&to&page&pageSize` (ADMIN, MANAGER; tanggal yyyy-mm-dd WIB) → `{ total, items: [{ id, at, action, entityType, entityId, actor, actorRole, changes }] }`.

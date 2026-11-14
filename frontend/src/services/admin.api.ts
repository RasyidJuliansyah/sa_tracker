// Layanan admin lewat API sungguhan (bentuk sama dengan admin.mock.ts).
import type { AccountRole, AccountStatus, AuditAction, AuditChange, MockAccount, MockAuditEntry, MockMasterItem } from '@/mocks/admin'
import type { IndoTimezone } from '@/utils/timezone'
import { api } from './http'
import type { AccountFilter, AccountInput, AuditFilter, MasterKind } from './admin.mock'

interface ApiAccount { id: number; name: string; email: string; role: AccountRole; timezone: IndoTimezone; status: AccountStatus; lastLoginAt: string | null }

const WIB = 'Asia/Jakarta'
const fmt = (o: Intl.DateTimeFormatOptions, d: Date) => new Intl.DateTimeFormat('id-ID', { ...o, timeZone: WIB }).format(d)
const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: WIB }).format(d)

/** "Hari ini, 08.10" / "Kemarin, 16.05" / "2 Sep 2026" menurut WIB. */
export function lastLoginLabel(iso: string | null, now = new Date()): string {
  if (!iso) return 'Belum pernah login'
  const d = new Date(iso)
  const time = fmt({ hour: '2-digit', minute: '2-digit', hour12: false }, d).replace(':', '.')
  const k = dayKey(d)
  if (k === dayKey(now)) return `Hari ini, ${time}`
  if (k === dayKey(new Date(now.getTime() - 86_400_000))) return `Kemarin, ${time}`
  return fmt({ day: 'numeric', month: 'short', year: 'numeric' }, d)
}

const toAccount = (a: ApiAccount): MockAccount => ({ ...a, lastLoginLabel: lastLoginLabel(a.lastLoginAt) })
let accountCache: MockAccount[] = []
const masterCache: Record<MasterKind, MockMasterItem[]> = { level: [], package: [] }
const path = (k: MasterKind) => (k === 'level' ? 'jenjang' : 'packages')

export async function listAccounts(f: AccountFilter): Promise<MockAccount[]> {
  const qs = new URLSearchParams()
  if (f.query.trim()) qs.set('query', f.query.trim())
  if (f.role) qs.set('role', f.role)
  if (f.status) qs.set('status', f.status)
  const { items } = await api<{ items: ApiAccount[] }>(`/users?${qs}`)
  accountCache = items.map(toAccount)
  return accountCache
}
export async function createAccount(i: AccountInput): Promise<MockAccount> {
  const r = await api<{ account: ApiAccount }>('/users', { method: 'POST', body: { name: i.name, email: i.email, role: i.role, timezone: i.timezone, password: i.password } })
  return toAccount(r.account)
}
export async function updateAccount(id: number, i: Omit<AccountInput, 'password'>): Promise<void> {
  await api(`/users/${id}`, { method: 'PATCH', body: { name: i.name, email: i.email, role: i.role, timezone: i.timezone } })
}
export async function setAccountActive(id: number, active: boolean): Promise<void> {
  await api(`/users/${id}`, { method: 'PATCH', body: { isActive: active } })
}
export async function resetAccountPassword(id: number, tempPassword: string): Promise<string> {
  return (await api<{ tempPassword: string }>(`/users/${id}/reset-password`, { method: 'POST', body: { password: tempPassword } })).tempPassword
}
export function emailExists(email: string, exceptId?: number): boolean {
  return accountCache.some((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.id !== exceptId)
}

export async function listMaster(kind: MasterKind): Promise<MockMasterItem[]> {
  const { items } = await api<{ items: MockMasterItem[] }>(`/master/${path(kind)}`)
  masterCache[kind] = items
  return items
}
export function masterNameExists(kind: MasterKind, name: string, exceptId?: number): boolean {
  return masterCache[kind].some((i) => i.name.toLowerCase() === name.trim().toLowerCase() && i.id !== exceptId)
}
export async function createMaster(kind: MasterKind, name: string): Promise<void> {
  await api(`/master/${path(kind)}`, { method: 'POST', body: { name } })
}
export async function renameMaster(kind: MasterKind, id: number, name: string): Promise<void> {
  await api(`/master/${path(kind)}/${id}`, { method: 'PATCH', body: { name } })
}
export async function setMasterActive(kind: MasterKind, id: number, active: boolean): Promise<void> {
  await api(`/master/${path(kind)}/${id}`, { method: 'PATCH', body: { active } })
}

// ---- Audit log ----
const ENTITY: Record<string, { label: string; table: string }> = {
  user: { label: 'Akun', table: 'users' }, school: { label: 'Sekolah', table: 'schools' }, contract: { label: 'Kontrak', table: 'school_contracts' },
  assignment: { label: 'Penugasan', table: 'school_assignments' }, visit: { label: 'Kunjungan', table: 'visits' },
  jenjang: { label: 'Jenjang', table: 'jenjang' }, package: { label: 'Paket', table: 'packages' },
}
const entityOf = (label: string) => Object.keys(ENTITY).find((k) => ENTITY[k]!.label === label)
const ROLE = { ADMIN: 'Admin', MANAGER: 'Manager', AGENT: 'Agent' } as const

interface ApiAudit { id: number; at: string; action: string; entityType: string; entityId: number | null; actor: string | null; actorRole: keyof typeof ROLE | null; changes: unknown }

function diff(changes: unknown): AuditChange[] {
  const c = changes as { before?: Record<string, unknown>; after?: Record<string, unknown> } | null
  if (!c?.after) return []
  const show = (v: unknown) => (v === undefined || v === null ? null : String(v))
  return Object.keys(c.after).filter((k) => show(c.before?.[k]) !== show(c.after![k])).map((k) => ({ field: k, before: show(c.before?.[k]), after: show(c.after![k]) }))
}

function toEntry(a: ApiAudit): MockAuditEntry {
  const e = ENTITY[a.entityType] ?? { label: a.entityType === 'user' ? 'Akun' : a.entityType, table: a.entityType }
  const action = (a.action === 'ASSIGN' || a.action === 'UNASSIGN' ? 'MOVE' : a.action) as AuditAction
  const sesi = a.action === 'LOGIN' || a.action === 'LOGIN_FAILED'
  return {
    id: a.id, at: a.at, actor: a.actor ?? 'Tidak dikenal', actorRole: a.actorRole ? ROLE[a.actorRole] : 'Agent', action,
    dataType: sesi ? 'Sesi' : e.label, dataLabel: sesi ? 'Sesi' : `${e.label}${a.entityId ? ` #${a.entityId}` : ''}`,
    tableName: e.table, recordIds: a.entityId ? `#${a.entityId}` : '', changes: diff(a.changes),
  }
}

let actorIds = new Map<string, number>()
export async function listAuditActors(): Promise<string[]> {
  const { items } = await api<{ items: ApiAccount[] }>('/users')
  actorIds = new Map(items.map((u) => [u.name, u.id]))
  return [...actorIds.keys()]
}

const key = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: WIB }).format(d)

export async function listAudit(f: AuditFilter): Promise<MockAuditEntry[]> {
  if (f.actor && !actorIds.has(f.actor)) await listAuditActors()
  const qs = new URLSearchParams({ pageSize: '100' })
  if (f.dataType && f.dataType !== 'Sesi') { const t = entityOf(f.dataType); if (t) qs.set('entityType', t) }
  if (f.action) qs.set('action', f.action === 'MOVE' ? 'ASSIGN' : f.action)
  if (f.actor && actorIds.has(f.actor)) qs.set('actorId', String(actorIds.get(f.actor)))
  if (f.from) qs.set('from', key(f.from))
  if (f.to) qs.set('to', key(f.to))
  const out: MockAuditEntry[] = []
  for (let page = 1; page <= 5; page++) {
    qs.set('page', String(page))
    const r = await api<{ total: number; items: ApiAudit[] }>(`/audit-logs?${qs}`)
    out.push(...r.items.map(toEntry))
    if (out.length >= r.total) break
  }
  return out
}

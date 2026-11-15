// Lapisan layanan admin. Sekarang mengembalikan data tiruan dalam memori; nanti diganti panggilan API
// tanpa mengubah layar yang membacanya.
import type { AccountImportRow } from '@/components/admin/account-import-rules'
import { asZone } from '@/components/admin/account-import-rules'
import {
  initialAccounts, initialAudit, initialLevels, initialPackages,
  type AccountRole, type AccountStatus, type MockAccount, type MockAuditEntry, type MockMasterItem,
} from '@/mocks/admin'
import type { IndoTimezone } from '@/utils/timezone'

let accounts: MockAccount[] = initialAccounts.map((a) => ({ ...a }))
let levels: MockMasterItem[] = initialLevels.map((a) => ({ ...a }))
let packages: MockMasterItem[] = initialPackages.map((a) => ({ ...a }))
const audit: MockAuditEntry[] = initialAudit
export interface MockAccountExportLog { id: number; at: string; actor: string; kind: string; filter: string; rows: number }
let accountExports: MockAccountExportLog[] = []

export interface AccountInput { name: string; email: string; role: AccountRole; timezone: IndoTimezone; password?: string }
export interface AccountFilter { query: string; role: AccountRole | null; status: AccountStatus | null }
export type MasterKind = 'level' | 'package'

/** Password sementara default untuk semua akun baru dan reset password. */
export function generateTempPassword(): string {
  return 'SkollaEdu'
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function listAccounts(filter: AccountFilter): Promise<MockAccount[]> {
  const q = filter.query.trim().toLowerCase()
  return accounts.filter(
    (a) =>
      (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) &&
      (!filter.role || a.role === filter.role) &&
      (!filter.status || a.status === filter.status),
  )
}

export async function createAccount(input: AccountInput): Promise<MockAccount> {
  const created: MockAccount = {
    id: Math.max(0, ...accounts.map((a) => a.id)) + 1,
    name: input.name.trim(), email: input.email.trim().toLowerCase(), role: input.role, timezone: input.timezone,
    status: 'MUST_CHANGE_PASSWORD', lastLoginLabel: 'Belum pernah login',
  }
  accounts = [...accounts, created]
  return created
}

export async function updateAccount(id: number, input: Omit<AccountInput, 'password'>): Promise<void> {
  accounts = accounts.map((a) => (a.id === id ? { ...a, name: input.name.trim(), email: input.email.trim().toLowerCase(), role: input.role, timezone: input.timezone } : a))
}

export async function setAccountActive(id: number, active: boolean): Promise<void> {
  accounts = accounts.map((a) => (a.id === id ? { ...a, status: active ? 'ACTIVE' : 'INACTIVE' } : a))
}

export async function resetAccountPassword(id: number, tempPassword: string): Promise<string> {
  accounts = accounts.map((a) => (a.id === id ? { ...a, status: 'MUST_CHANGE_PASSWORD' } : a))
  return tempPassword
}

export function emailExists(email: string, exceptId?: number): boolean {
  return accounts.some((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.id !== exceptId)
}

// Impor/ekspor CSV akun (dev:mock). Mode API langsung memanggil server dari panel.
export const existingAccountEmails = (): Set<string> => new Set(accounts.map((a) => a.email))
export async function commitAccountImport(rows: AccountImportRow[]): Promise<{ created: number; updated: number }> {
  let created = 0, updated = 0
  for (const r of rows.filter((x) => x.ok)) {
    const existing = accounts.find((a) => a.email === r.email)
    if (existing) {
      accounts = accounts.map((a) => (a.id === existing.id ? { ...a, name: r.name, role: r.role as AccountRole, timezone: asZone(r.timezone) } : a))
      updated++
    } else {
      accounts = [...accounts, {
        id: Math.max(0, ...accounts.map((a) => a.id)) + 1, name: r.name, email: r.email, role: r.role as AccountRole,
        timezone: asZone(r.timezone), status: 'MUST_CHANGE_PASSWORD', lastLoginLabel: 'Belum pernah login',
      }]
      created++
    }
  }
  return { created, updated }
}
export async function listAccountExports(): Promise<MockAccountExportLog[]> {
  return [...accountExports]
}
export async function addAccountExportLog(kind: string, filter: string, rows: number): Promise<void> {
  accountExports = [{ id: Math.max(0, ...accountExports.map((e) => e.id)) + 1, at: new Date().toISOString(), actor: 'Fajar Hidayat', kind, filter, rows }, ...accountExports]
}

function bucket(kind: MasterKind): MockMasterItem[] {
  return kind === 'level' ? levels : packages
}
function store(kind: MasterKind, next: MockMasterItem[]) {
  if (kind === 'level') levels = next
  else packages = next
}

export async function listMaster(kind: MasterKind): Promise<MockMasterItem[]> {
  return bucket(kind).map((i) => ({ ...i }))
}

export function masterNameExists(kind: MasterKind, name: string, exceptId?: number): boolean {
  return bucket(kind).some((i) => i.name.toLowerCase() === name.trim().toLowerCase() && i.id !== exceptId)
}

export async function createMaster(kind: MasterKind, name: string): Promise<void> {
  const items = bucket(kind)
  store(kind, [...items, { id: Math.max(0, ...items.map((i) => i.id)) + 1, name: name.trim(), schoolCount: 0, active: true }])
}

export async function renameMaster(kind: MasterKind, id: number, name: string): Promise<void> {
  store(kind, bucket(kind).map((i) => (i.id === id ? { ...i, name: name.trim() } : i)))
}

export async function setMasterActive(kind: MasterKind, id: number, active: boolean): Promise<void> {
  store(kind, bucket(kind).map((i) => (i.id === id ? { ...i, active } : i)))
}

export interface AuditFilter { dataType: string | null; action: string | null; actor: string | null; from: Date | null; to: Date | null }

export async function listAudit(filter: AuditFilter): Promise<MockAuditEntry[]> {
  const from = filter.from ? new Date(filter.from) : null
  const to = filter.to ? new Date(filter.to) : null
  if (from) from.setHours(0, 0, 0, 0)
  if (to) to.setHours(23, 59, 59, 999)
  return [...audit].sort((a, b) => b.id - a.id).filter((e) => {
    const at = new Date(e.at)
    return (
      (!filter.dataType || e.dataType === filter.dataType) &&
      (!filter.action || e.action === filter.action) &&
      (!filter.actor || e.actor === filter.actor) &&
      (!from || at >= from) &&
      (!to || at <= to)
    )
  })
}

export const auditDataTypes = ['Kunjungan', 'Sesi', 'Rekap kunjungan', 'Penugasan', 'Akun', 'Kontrak', 'Sekolah']
export const auditActors = ['Fajar Hidayat', 'Rina Nurhayati', 'Dimas Saputra', 'Ayu Lestari', 'Yohanes Wenda']

export async function listAuditActors(): Promise<string[]> {
  return auditActors
}

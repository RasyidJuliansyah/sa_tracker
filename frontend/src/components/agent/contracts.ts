import type { ChipTone } from '@/components/StatusChip.vue'

// Aturan murni tampilan kontrak untuk agent (data tiruan). Rumus resmi retention ada di service backend nanti;
// di sini hanya turunan per kontrak: nilai perpanjangan yang sudah ditandatangani ÷ nilai kontrak, tidak dibatasi 100%.
export interface Contract {
  id: number
  title: string
  startDate: string // yyyy-mm-dd
  endDate: string
  value: number
  previousContractId?: number
  signedDate?: string // wajib untuk perpanjangan
}

const DAY_MS = 86_400_000
const EXPIRING_SOON_DAYS = 90
const id = 'id-ID'
const utc = (d: string) => new Date(`${d}T00:00:00Z`)

/** 6 Nov 2026 (tanggal tanpa jam, tidak bergeser zona) */
export function formatContractDate(d: string): string {
  return new Intl.DateTimeFormat(id, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(utc(d))
}

/** "1 Jan – 31 Des 2026"; tahun awal ikut ditulis bila periode lintas tahun. */
export function formatPeriod(start: string, end: string): string {
  const s = utc(start)
  const e = utc(end)
  const withYear = s.getUTCFullYear() !== e.getUTCFullYear()
  const part = new Intl.DateTimeFormat(id, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' as const } : {}), timeZone: 'UTC' }).format(s)
  return `${part} – ${formatContractDate(end)}`
}

export function daysUntil(date: string, today: string): number {
  return Math.round((utc(date).getTime() - utc(today).getTime()) / DAY_MS)
}

export function isRunning(c: Contract, today: string): boolean {
  return c.startDate <= today && today <= c.endDate
}

/** Perpanjangan yang sudah ditandatangani untuk kontrak ini (paling banyak satu). */
export function signedRenewalOf(c: Contract, all: Contract[]): Contract | undefined {
  return all.find((x) => x.previousContractId === c.id && Boolean(x.signedDate))
}

/** Retention satu kontrak, dalam persen. Tanpa perpanjangan yang ditandatangani = 0. */
export function contractRetention(c: Contract, all: Contract[]): number {
  const renewal = signedRenewalOf(c, all)
  return renewal ? (renewal.value / c.value) * 100 : 0
}

/** Kontrak berjalan hari ini, atau kontrak terakhir yang berakhir bila tidak ada yang berjalan. */
export function focusContract(all: Contract[], today: string): Contract | undefined {
  return all.find((c) => isRunning(c, today)) ?? [...all].filter((c) => c.endDate < today).sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
}

export interface StatusView {
  label: string
  tone: ChipTone
}

/** Status perpanjangan sekolah untuk daftar Sekolah saya. */
export function renewalStatus(all: Contract[], today: string): StatusView | null {
  const c = focusContract(all, today)
  if (!c) return null
  if (signedRenewalOf(c, all)) return { label: 'Sudah diperpanjang', tone: 'success' }
  if (c.endDate < today) return { label: 'Berakhir, belum diperpanjang', tone: 'error' }
  if (daysUntil(c.endDate, today) <= EXPIRING_SOON_DAYS) return { label: `Berakhir ${formatContractDate(c.endDate)}`, tone: 'warning' }
  return { label: `Berjalan s.d. ${formatContractDate(c.endDate)}`, tone: 'brand' }
}

/** Chip status satu baris riwayat kontrak. */
export function contractStateChip(c: Contract, today: string): StatusView {
  if (c.startDate > today) return { label: `Ditandatangani ${c.signedDate ? formatContractDate(c.signedDate) : '–'}`, tone: 'brand' }
  return isRunning(c, today) ? { label: 'Berjalan', tone: 'info' } : { label: 'Selesai', tone: 'neutral' }
}

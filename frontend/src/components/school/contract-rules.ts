// Aturan murni kontrak sekolah untuk layar (tanpa database). Rumus retention kohort tahunan ada di backend, bukan di sini.
import { MOCK_TODAY, type MockContract } from '@/mocks/school'

export const ENDING_SOON_DAYS = 60

export interface Period { start: string; end: string }

const dayMs = 86_400_000
const toUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

/** Selisih hari kalender (to - from) untuk tanggal 'YYYY-MM-DD'. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / dayMs)
}

/** Periode inklusif tumpang tindih bila saling menyentuh sehari pun. */
export function periodsOverlap(a: Period, b: Period): boolean {
  return a.start <= b.end && b.start <= a.end
}

/** Galat periode kontrak, atau '' bila sah. Berakhir harus setelah mulai. */
export function validatePeriod(start: string, end: string): string {
  if (!start || !end) return ''
  return end > start ? '' : 'Tanggal berakhir harus setelah tanggal mulai'
}

export function findOverlap(period: Period, contracts: MockContract[]): MockContract | undefined {
  return contracts.find((c) => periodsOverlap(period, c))
}

export interface RenewalInput { signedDate: string; start: string; end: string; value: number | null }
export interface RenewalErrors { signedDate: string; start: string; end: string; value: string; form: string }

/** Validasi perpanjangan: tanggal tanda tangan wajib, periode tidak tumpang tindih, satu kontrak satu perpanjangan. */
export function validateRenewal(input: RenewalInput, base: MockContract, schoolContracts: MockContract[]): RenewalErrors {
  const errors: RenewalErrors = { signedDate: '', start: '', end: '', value: '', form: '' }
  if (!input.signedDate) errors.signedDate = 'Tanggal tanda tangan wajib diisi'
  if (!input.start) errors.start = 'Tanggal mulai wajib diisi'
  if (!input.end) errors.end = 'Tanggal berakhir wajib diisi'
  if (!input.value || input.value <= 0) errors.value = 'Nilai kontrak wajib diisi'
  if (!errors.end) errors.end = validatePeriod(input.start, input.end)
  if (schoolContracts.some((c) => c.previousContractId === base.id)) {
    errors.form = `${base.label} sudah punya perpanjangan`
  } else if (input.start && input.end && !errors.end) {
    const clash = findOverlap({ start: input.start, end: input.end }, schoolContracts)
    if (clash) errors.start = `Periode tumpang tindih dengan ${clash.label}`
  }
  return errors
}

export const hasErrors = (e: object) => Object.values(e).some(Boolean)

/** Retention satu kontrak (tampilan): nilai perpanjangan ÷ nilai kontrak, dalam persen, tidak dibatasi 100. */
export function renewalRatio(renewalValue: number, baseValue: number): number {
  return baseValue > 0 ? (renewalValue / baseValue) * 100 : 0
}

export function renewalOf(contract: MockContract, contracts: MockContract[]): MockContract | undefined {
  return contracts.find((c) => c.previousContractId === contract.id)
}

/** Kontrak berjalan = mulai ≤ hari ini ≤ berakhir. Bila tidak ada, kontrak dengan tanggal berakhir terbaru yang sudah mulai. */
export function currentContract(contracts: MockContract[], today = MOCK_TODAY): MockContract | undefined {
  const sorted = [...contracts].sort((a, b) => b.end.localeCompare(a.end))
  return sorted.find((c) => c.start <= today && today <= c.end) ?? sorted.find((c) => c.start <= today) ?? sorted[0]
}

export type RenewalKind = 'RENEWED' | 'EXPIRED' | 'ENDING_SOON' | 'RUNNING'
export interface RenewalStatus { kind: RenewalKind; daysLeft: number }

export function renewalStatus(contracts: MockContract[], today = MOCK_TODAY): RenewalStatus | null {
  const cur = currentContract(contracts, today)
  if (!cur) return null
  const daysLeft = daysBetween(today, cur.end)
  if (renewalOf(cur, contracts)) return { kind: 'RENEWED', daysLeft }
  if (daysLeft < 0) return { kind: 'EXPIRED', daysLeft }
  if (daysLeft <= ENDING_SOON_DAYS) return { kind: 'ENDING_SOON', daysLeft }
  return { kind: 'RUNNING', daysLeft }
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * dayMs).toISOString().slice(0, 10)
}

/** Usulan periode perpanjangan: mulai sehari setelah kontrak lama berakhir, durasi sama dengan kontrak lama (min. 1 hari). */
export function suggestRenewalPeriod(base: Period): Period {
  const start = addDays(base.end, 1)
  const length = Math.max(1, daysBetween(base.start, base.end))
  return { start, end: addDays(start, length) }
}

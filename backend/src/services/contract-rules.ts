import { AppError } from '../utils/errors.js'
import { isDateKey } from '../utils/timezone.js'

export interface ContractPeriod {
  id?: number
  startDate: string // yyyy-mm-dd
  endDate: string
}

/** Kontrak berjalan: mulai ≤ hari ini (WIB) ≤ berakhir. */
export function isRunning(c: ContractPeriod, todayWib: string): boolean {
  return c.startDate <= todayWib && todayWib <= c.endDate
}

/** Validasi kontrak baru terhadap kontrak lain milik sekolah yang sama. Lempar AppError bila tidak valid. */
export function validateContractPeriod(next: ContractPeriod, others: ContractPeriod[]): void {
  if (!isDateKey(next.startDate) || !isDateKey(next.endDate)) {
    throw new AppError('VALIDATION', 'Tanggal kontrak tidak valid.')
  }
  if (next.endDate <= next.startDate) {
    throw new AppError('VALIDATION', 'Tanggal berakhir harus setelah tanggal mulai.')
  }
  const overlap = others.some((o) => o.id !== next.id && next.startDate <= o.endDate && o.startDate <= next.endDate)
  if (overlap) throw new AppError('CONFLICT', 'Periode kontrak tumpang tindih dengan kontrak lain sekolah ini.')
}

/** Validasi perpanjangan: perpanjangan wajib bertanggal tanda tangan dan kontrak lama belum punya perpanjangan. */
export function validateRenewal(args: { signedDate: string | null | undefined; previousHasRenewal: boolean }): void {
  if (!args.signedDate || !isDateKey(args.signedDate)) {
    throw new AppError('VALIDATION', 'Tanggal tanda tangan perpanjangan wajib diisi.')
  }
  if (args.previousHasRenewal) {
    throw new AppError('CONFLICT', 'Kontrak ini sudah punya perpanjangan.')
  }
}

export const ENDING_SOON_DAYS = 60
export interface ContractLite { id: number; startDate: string; endDate: string; previousContractId: number | null }
export type RenewalKind = 'RENEWED' | 'EXPIRED' | 'ENDING_SOON' | 'RUNNING'

const dayNum = (k: string) => Math.round(Date.parse(`${k}T00:00:00Z`) / 86_400_000)
export const daysBetween = (from: string, to: string) => dayNum(to) - dayNum(from)

/** Kontrak yang ditampilkan: yang berjalan; bila tidak ada, yang terakhir sudah mulai; bila belum ada yang mulai, yang pertama. */
export function currentContract<T extends ContractLite>(contracts: T[], todayWib: string): T | undefined {
  const sorted = [...contracts].sort((a, b) => b.endDate.localeCompare(a.endDate))
  return sorted.find((c) => c.startDate <= todayWib && todayWib <= c.endDate) ?? sorted.find((c) => c.startDate <= todayWib) ?? sorted[0]
}

/** Status perpanjangan kontrak yang ditampilkan: sudah diperpanjang, lewat tempo, segera berakhir (≤ 60 hari), atau berjalan. */
export function renewalStatus(contracts: ContractLite[], todayWib: string): { kind: RenewalKind; daysLeft: number } | null {
  const cur = currentContract(contracts, todayWib)
  if (!cur) return null
  const daysLeft = daysBetween(todayWib, cur.endDate)
  if (contracts.some((c) => c.previousContractId === cur.id)) return { kind: 'RENEWED', daysLeft }
  if (daysLeft < 0) return { kind: 'EXPIRED', daysLeft }
  if (daysLeft <= ENDING_SOON_DAYS) return { kind: 'ENDING_SOON', daysLeft }
  return { kind: 'RUNNING', daysLeft }
}

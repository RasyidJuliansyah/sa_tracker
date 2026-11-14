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

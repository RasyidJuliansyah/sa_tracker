import { AppError } from '../utils/errors.js'
import { addDays, isDateKey } from '../utils/timezone.js'

// Status rencana yang DISIMPAN di database.
export type StoredPlanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
// Status yang DITAMPILKAN ke pengguna (termasuk yang dihitung, bukan disimpan).
export type DerivedPlanStatus =
  | 'PENDING' // Menunggu persetujuan
  | 'APPROVED' // Terjadwal
  | 'REJECTED' // Ditolak
  | 'CANCELLED' // Dibatalkan
  | 'DONE' // Selesai (kunjungan terhubung sudah check-out)
  | 'MISSED' // Terlewat (terjadwal, tanggal lewat, tanpa kunjungan terhubung)
  | 'EXPIRED' // Kedaluwarsa (menunggu persetujuan, tanggal lewat tanpa keputusan)

/** Status kunjungan terhubung (jika ada). Lihat visits.status. */
export type LinkedVisitStatus = 'ONGOING' | 'DONE' | null

export interface PlanForStatus {
  status: StoredPlanStatus
  planDate: string // yyyy-mm-dd (WIB)
  /** Status kunjungan yang terhubung ke rencana ini, atau null bila belum ada. */
  linkedVisit: LinkedVisitStatus
}

export const MAX_PLAN_DAYS_AHEAD = 90
export const PURPOSE_MIN = 5
export const PURPOSE_MAX = 255

/**
 * Status rencana yang ditampilkan, dihitung dari status tersimpan, tanggal, dan kunjungan terhubung.
 * Aturan (docs/prd-rencana-kunjungan.md, bagian Status rencana):
 * - Kunjungan terhubung sudah DONE  -> Selesai (apa pun tanggalnya).
 * - APPROVED + kunjungan ONGOING    -> tetap Terjadwal (agent masih di lokasi), tidak pernah Terlewat.
 * - APPROVED, tanggal lewat, tanpa kunjungan sama sekali -> Terlewat.
 * - PENDING, tanggal lewat          -> Kedaluwarsa.
 * - Selain itu                      -> status tersimpan apa adanya.
 */
export function derivePlanStatus(plan: PlanForStatus, todayWib: string): DerivedPlanStatus {
  if (plan.linkedVisit === 'DONE') return 'DONE'
  const past = plan.planDate < todayWib
  if (plan.status === 'APPROVED') {
    if (plan.linkedVisit === 'ONGOING') return 'APPROVED' // tetap Terjadwal sampai check-out
    return past ? 'MISSED' : 'APPROVED'
  }
  if (plan.status === 'PENDING') return past ? 'EXPIRED' : 'PENDING'
  return plan.status // REJECTED / CANCELLED
}

/** Rencana yang tampil di tab "Mendatang" (Terjadwal atau Menunggu persetujuan dan belum lewat). */
export function isUpcoming(d: DerivedPlanStatus): boolean {
  return d === 'APPROVED' || d === 'PENDING'
}

/** Rencana "terlaksana" untuk dashboard: kunjungan terhubung sudah DONE pada periode. */
export function isFulfilled(d: DerivedPlanStatus): boolean {
  return d === 'DONE'
}

/** Validasi tanggal rencana: format benar, tidak di masa lalu, maksimal 90 hari ke depan (WIB). */
export function validatePlanDate(planDate: string, todayWib: string): void {
  if (!isDateKey(planDate)) throw new AppError('VALIDATION', 'Tanggal rencana tidak valid.')
  if (planDate < todayWib) throw new AppError('VALIDATION', 'Tanggal rencana tidak boleh di masa lalu.')
  if (planDate > addDays(todayWib, MAX_PLAN_DAYS_AHEAD)) {
    throw new AppError('VALIDATION', `Tanggal rencana paling jauh ${MAX_PLAN_DAYS_AHEAD} hari ke depan.`)
  }
}

/** Validasi tujuan kunjungan: wajib, 5–255 karakter setelah trim. Mengembalikan teks yang sudah di-trim. */
export function validatePurpose(purpose: string): string {
  const t = purpose.trim()
  if (t.length < PURPOSE_MIN) throw new AppError('VALIDATION', `Tujuan kunjungan minimal ${PURPOSE_MIN} karakter.`)
  if (t.length > PURPOSE_MAX) throw new AppError('VALIDATION', `Tujuan kunjungan maksimal ${PURPOSE_MAX} karakter.`)
  return t
}

/**
 * Apakah agent boleh check-in di sekolah pada tanggal tertentu.
 * Lolos bila (a) sekolah sedang ditugaskan kepada agent, atau
 * (b) agent punya rencana APPROVED untuk sekolah+tanggal itu.
 * Lihat FR-13. `pendingForSchool` dipakai hanya untuk menyusun pesan penolakan.
 */
export interface CheckInEligibility {
  assigned: boolean
  hasApprovedPlanToday: boolean
  hasPendingPlanToday: boolean
}

export function checkInRejectionReason(e: CheckInEligibility): string | null {
  if (e.assigned || e.hasApprovedPlanToday) return null
  if (e.hasPendingPlanToday) return 'Pengajuan Anda untuk sekolah ini masih menunggu persetujuan manager.'
  return 'Sekolah ini bukan tugas Anda. Ajukan rencana kunjungan dulu.'
}

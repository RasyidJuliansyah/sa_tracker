import { describe, expect, it } from 'vitest'
import { AppError } from '../../src/utils/errors.js'
import {
  checkInRejectionReason,
  derivePlanStatus,
  isFulfilled,
  isUpcoming,
  validatePlanDate,
  validatePurpose,
  type PlanForStatus,
} from '../../src/services/visit-plan-rules.js'

const TODAY = '2026-11-16'
const plan = (p: Partial<PlanForStatus>): PlanForStatus => ({ status: 'APPROVED', planDate: TODAY, linkedVisit: null, ...p })

describe('derivePlanStatus', () => {
  it('APPROVED hari ini tanpa kunjungan = Terjadwal', () => {
    expect(derivePlanStatus(plan({ status: 'APPROVED', planDate: TODAY }), TODAY)).toBe('APPROVED')
  })
  it('APPROVED tanggal lewat tanpa kunjungan sama sekali = Terlewat', () => {
    expect(derivePlanStatus(plan({ status: 'APPROVED', planDate: '2026-11-10', linkedVisit: null }), TODAY)).toBe('MISSED')
  })
  it('kunjungan terhubung sudah DONE = Selesai (walau tanggal lewat)', () => {
    expect(derivePlanStatus(plan({ status: 'APPROVED', planDate: '2026-11-10', linkedVisit: 'DONE' }), TODAY)).toBe('DONE')
  })
  it('APPROVED + kunjungan masih ONGOING = tetap Terjadwal, bukan Selesai', () => {
    expect(derivePlanStatus(plan({ status: 'APPROVED', planDate: TODAY, linkedVisit: 'ONGOING' }), TODAY)).toBe('APPROVED')
  })
  it('KASUS TENGAH MALAM: tanggal sudah lewat tapi kunjungan masih ONGOING = tetap Terjadwal, bukan Terlewat', () => {
    // Agent check-in 17 Nov 23.00 WIB, belum check-out saat sudah lewat tengah malam (today = 18 Nov).
    expect(derivePlanStatus(plan({ status: 'APPROVED', planDate: '2026-11-17', linkedVisit: 'ONGOING' }), '2026-11-18')).toBe('APPROVED')
  })
  it('PENDING hari ini = Menunggu persetujuan', () => {
    expect(derivePlanStatus(plan({ status: 'PENDING', planDate: TODAY }), TODAY)).toBe('PENDING')
  })
  it('PENDING tanggal lewat = Kedaluwarsa', () => {
    expect(derivePlanStatus(plan({ status: 'PENDING', planDate: '2026-11-10' }), TODAY)).toBe('EXPIRED')
  })
  it('REJECTED dan CANCELLED tampil apa adanya', () => {
    expect(derivePlanStatus(plan({ status: 'REJECTED', planDate: '2026-11-10' }), TODAY)).toBe('REJECTED')
    expect(derivePlanStatus(plan({ status: 'CANCELLED', planDate: '2026-11-10' }), TODAY)).toBe('CANCELLED')
  })
  it('DONE menang atas apa pun (CANCELLED dengan kunjungan DONE tetap Selesai tidak terjadi; tapi DONE diutamakan)', () => {
    expect(derivePlanStatus(plan({ status: 'APPROVED', planDate: TODAY, linkedVisit: 'DONE' }), TODAY)).toBe('DONE')
  })
})

describe('isUpcoming / isFulfilled', () => {
  it('Mendatang = Terjadwal atau Menunggu persetujuan', () => {
    expect(isUpcoming('APPROVED')).toBe(true)
    expect(isUpcoming('PENDING')).toBe(true)
    expect(isUpcoming('MISSED')).toBe(false)
    expect(isUpcoming('DONE')).toBe(false)
  })
  it('Terlaksana = DONE saja', () => {
    expect(isFulfilled('DONE')).toBe(true)
    expect(isFulfilled('APPROVED')).toBe(false)
  })
})

describe('validatePlanDate', () => {
  it('menerima hari ini dan sampai 90 hari ke depan', () => {
    expect(() => validatePlanDate(TODAY, TODAY)).not.toThrow()
    expect(() => validatePlanDate('2027-02-14', TODAY)).not.toThrow() // 90 hari
  })
  it('menolak tanggal kemarin', () => {
    expect(() => validatePlanDate('2026-11-15', TODAY)).toThrow(AppError)
  })
  it('menolak lebih dari 90 hari ke depan', () => {
    expect(() => validatePlanDate('2027-02-15', TODAY)).toThrow(AppError) // 91 hari
  })
  it('menolak format tanggal yang salah', () => {
    expect(() => validatePlanDate('16-11-2026', TODAY)).toThrow(AppError)
  })
})

describe('validatePurpose', () => {
  it('menerima dan men-trim tujuan yang valid', () => {
    expect(validatePurpose('  Perkenalan paket baru  ')).toBe('Perkenalan paket baru')
  })
  it('menolak tujuan terlalu pendek', () => {
    expect(() => validatePurpose('abc')).toThrow(AppError)
  })
  it('menolak tujuan melebihi 255 karakter', () => {
    expect(() => validatePurpose('x'.repeat(256))).toThrow(AppError)
  })
})

describe('checkInRejectionReason', () => {
  it('lolos bila ditugaskan', () => {
    expect(checkInRejectionReason({ assigned: true, hasApprovedPlanToday: false, hasPendingPlanToday: false })).toBeNull()
  })
  it('lolos bila ada rencana terjadwal hari ini', () => {
    expect(checkInRejectionReason({ assigned: false, hasApprovedPlanToday: true, hasPendingPlanToday: false })).toBeNull()
  })
  it('pengajuan masih menunggu -> pesan menunggu persetujuan', () => {
    expect(checkInRejectionReason({ assigned: false, hasApprovedPlanToday: false, hasPendingPlanToday: true })).toMatch(/menunggu persetujuan/i)
  })
  it('tanpa tugas dan tanpa rencana -> pesan ajukan rencana dulu', () => {
    expect(checkInRejectionReason({ assigned: false, hasApprovedPlanToday: false, hasPendingPlanToday: false })).toMatch(/bukan tugas Anda/i)
  })
})

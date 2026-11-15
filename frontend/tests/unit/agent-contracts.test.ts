import { describe, expect, it } from 'vitest'
import { contractRetention, contractStateChip, daysUntil, focusContract, formatPeriod, renewalStatus } from '@/components/agent/contracts'
import type { Contract } from '@/components/agent/contracts'

// Fixture lokal (dulu dari mocks/agent.ts, dipindah ke sini supaya mocks/*.ts bisa dikosongin tanpa menyentuh tes ini).
const TODAY = '2026-11-14'
const bina: Contract[] = [
  { id: 12, title: 'Perpanjangan 2027', startDate: '2027-01-01', endDate: '2027-12-31', value: 80_000_000, previousContractId: 11, signedDate: '2026-11-06' },
  { id: 11, title: 'Kontrak 2026', startDate: '2026-01-01', endDate: '2026-12-31', value: 80_000_000, previousContractId: 10, signedDate: '2025-11-20' },
  { id: 10, title: 'Kontrak 2025', startDate: '2025-01-01', endDate: '2025-12-31', value: 72_000_000 },
]
const gemilang: Contract[] = [{ id: 30, title: 'Kontrak 2026', startDate: '2025-10-01', endDate: '2026-09-30', value: 45_000_000 }]
const depok: Contract[] = [{ id: 50, title: 'Kontrak 2026', startDate: '2026-01-01', endDate: '2026-12-31', value: 60_000_000 }]
const karawang: Contract[] = [{ id: 40, title: 'Kontrak 2026/2027', startDate: '2026-07-01', endDate: '2027-06-30', value: 95_000_000 }]

describe('retention kontrak', () => {
  it('perpanjangan sama besar = 100,0%', () => {
    expect(contractRetention(bina.find((c) => c.id === 11)!, bina)).toBeCloseTo(100)
  })
  it('tidak dibatasi 100%: 80 jt dari 72 jt = 111,1%', () => {
    expect(contractRetention(bina.find((c) => c.id === 10)!, bina)).toBeCloseTo(111.11, 1)
  })
  it('tanpa perpanjangan yang ditandatangani = 0', () => {
    expect(contractRetention(gemilang[0]!, gemilang)).toBe(0)
    const unsigned: Contract[] = [{ id: 1, title: 'A', startDate: '2026-01-01', endDate: '2026-12-31', value: 80 }, { id: 2, title: 'B', startDate: '2027-01-01', endDate: '2027-12-31', value: 80, previousContractId: 1 }]
    expect(contractRetention(unsigned[0]!, unsigned)).toBe(0)
  })
  it('contoh A dan B dari PLAN: 80 jt -> 80 jt = 100%, 20 jt -> 10 jt = 50%', () => {
    const a: Contract[] = [{ id: 1, title: 'A', startDate: '2026-01-01', endDate: '2026-12-31', value: 80_000_000 }, { id: 2, title: 'A+', startDate: '2027-01-01', endDate: '2027-12-31', value: 80_000_000, previousContractId: 1, signedDate: '2026-10-01' }]
    const b: Contract[] = [{ id: 3, title: 'B', startDate: '2026-01-01', endDate: '2026-12-31', value: 20_000_000 }, { id: 4, title: 'B+', startDate: '2027-01-01', endDate: '2027-12-31', value: 10_000_000, previousContractId: 3, signedDate: '2026-10-01' }]
    expect(contractRetention(a[0]!, a)).toBe(100)
    expect(contractRetention(b[0]!, b)).toBe(50)
  })
})

describe('kontrak berjalan dan status perpanjangan', () => {
  it('kontrak berjalan = mulai <= hari ini <= berakhir', () => {
    expect(focusContract(bina, TODAY)?.id).toBe(11)
    expect(focusContract(bina, '2026-01-01')?.id).toBe(11)
    expect(focusContract(bina, '2025-12-31')?.id).toBe(10)
  })
  it('status untuk empat sekolah sesuai Figma', () => {
    expect(renewalStatus(bina, TODAY)).toEqual({ label: 'Sudah diperpanjang', tone: 'success' })
    expect(renewalStatus(gemilang, TODAY)).toEqual({ label: 'Berakhir, belum diperpanjang', tone: 'error' })
    expect(renewalStatus(depok, TODAY)).toEqual({ label: 'Berakhir 31 Des 2026', tone: 'warning' })
    expect(renewalStatus(karawang, TODAY)).toEqual({ label: 'Berjalan s.d. 30 Jun 2027', tone: 'brand' })
  })
  it('tanpa kontrak (sekolah tidak ditugaskan) tidak ada status', () => {
    expect(renewalStatus([], TODAY)).toBeNull()
  })
  it('chip status riwayat kontrak', () => {
    expect(contractStateChip(bina.find((c) => c.id === 12)!, TODAY).label).toBe('Ditandatangani 6 Nov 2026')
    expect(contractStateChip(bina.find((c) => c.id === 11)!, TODAY).label).toBe('Berjalan')
    expect(contractStateChip(bina.find((c) => c.id === 10)!, TODAY).label).toBe('Selesai')
  })
})

describe('format tanggal kontrak', () => {
  it('periode satu tahun dan lintas tahun', () => {
    expect(formatPeriod('2026-01-01', '2026-12-31')).toBe('1 Jan – 31 Des 2026')
    expect(formatPeriod('2025-10-01', '2026-09-30')).toBe('1 Okt 2025 – 30 Sep 2026')
  })
  it('hari menuju berakhir', () => {
    expect(daysUntil('2026-12-31', TODAY)).toBe(47)
  })
})

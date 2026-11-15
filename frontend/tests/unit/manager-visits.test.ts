import { describe, expect, it } from 'vitest'
import { dateRangeKeys, dateRangeLabel } from '@/components/manager/date-range'
import { filterVisits, validateAgentInput, type VisitRow } from '@/services/manager'

const none = { from: null, to: null, agentId: null, schoolId: null, status: null } as const

// Fixture lokal (dulu dari mocks/manager.ts via listVisits/getVisit, dipindah ke sini supaya
// mocks/*.ts bisa dikosongin). filterVisits murni jadi fokus tes; detail toRow() tidak diuji ulang di sini.
const row = (over: Partial<VisitRow>): VisitRow => ({
  id: 1, dateKey: '2026-11-14', dayLabel: 'Sabtu', dateLabel: '14 Nov 2026',
  agentId: 4, agentName: 'Dimas Saputra', schoolId: 1, schoolName: 'SMA Bina Insani Bekasi', assigned: true,
  timezone: 'WIB', checkInAt: '2026-11-14T02:15:00.000Z', checkOutAt: null, durationMinutes: 85,
  status: 'ONGOING', report: null, accuracyM: 12, lat: -6.2383, lng: 106.9756, ...over,
})
const rows: VisitRow[] = [
  row({ id: 1, status: 'ONGOING' }),
  row({ id: 2, status: 'ONGOING', agentId: 5, agentName: 'Ayu Lestari' }),
  row({ id: 3, dateKey: '2026-11-13', status: 'COMPLETED', checkOutAt: '2026-11-13T03:15:00.000Z', agentId: 6, agentName: 'Yohanes Wenda' }),
  row({ id: 4, dateKey: '2026-11-01', status: 'COMPLETED', checkOutAt: '2026-11-01T03:15:00.000Z' }),
]

describe('filter rekap manager', () => {
  it('filter rentang tanggal, agent, status', () => {
    expect(filterVisits(rows, { ...none, from: '2026-11-14', to: '2026-11-14' })).toHaveLength(2)
    expect(filterVisits(rows, { ...none, agentId: 6 }).every((r) => r.agentName === 'Yohanes Wenda')).toBe(true)
    expect(filterVisits(rows, { ...none, status: 'ONGOING' })).toHaveLength(2)
  })
})

describe('rentang tanggal', () => {
  it('label dan kunci', () => {
    const r = [new Date(2026, 10, 1), new Date(2026, 10, 14)]
    expect(dateRangeLabel(r)).toBe('1–14 Nov 2026')
    expect(dateRangeKeys(r)).toEqual({ from: '2026-11-01', to: '2026-11-14' })
    expect(dateRangeLabel([])).toBe('Semua tanggal')
  })
})

describe('validasi akun agent', () => {
  it('nama dan zona wajib', () => {
    expect(validateAgentInput({ name: ' ', timezone: null })).toEqual({ name: 'Nama wajib diisi', timezone: 'Zona waktu wajib dipilih' })
    expect(validateAgentInput({ name: 'Ayu', timezone: 'WITA' })).toEqual({ name: '', timezone: '' })
  })
})


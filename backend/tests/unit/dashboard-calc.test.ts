import { describe, expect, it } from 'vitest'
import { seriesFor, totalsFor, type VisitLite } from '../../src/services/dashboard-calc.js'
import { cohortBreakdown } from '../../src/services/retention.js'
import { periodFor } from '../../src/utils/period.js'

const wib = (s: string) => new Date(`${s}+07:00`)
const v = (agentId: number, schoolId: number, inAt: string, outAt: string | null, assigned = true): VisitLite => ({ agentId, schoolId, checkInAt: wib(inAt), checkOutAt: outAt ? wib(outAt) : null, assigned })

describe('statistik periode (WIB)', () => {
  const visits = [
    v(1, 10, '2026-11-09T00:30:00', '2026-11-09T01:30:00'), // Senin 00.30 WIB (= Minggu 17.30 UTC)
    v(1, 11, '2026-11-14T10:00:00', null, false),
    v(2, 10, '2026-11-02T09:00:00', '2026-11-02T10:30:00', true), // minggu lalu
    v(2, 12, '2026-11-16T00:10:00', '2026-11-16T00:50:00'), // minggu depan
  ]
  const week = periodFor('week', '2026-11-14')
  it('kunjungan 00.30 WIB hari Senin masuk minggu ini, bukan minggu lalu', () => {
    const t = totalsFor(visits, [], week)
    expect(t).toMatchObject({ visits: 2, ongoing: 1, schools: 2, completed: 1, durationMinutes: 60, assignedVisits: 1, otherVisits: 1 })
    expect(totalsFor(visits, [], periodFor('week', '2026-11-14', -1)).visits).toBe(1)
  })
  it('perpanjangan dihitung dari tanggal tanda tangan di periode', () => {
    const r = [{ value: 80, signedDate: '2026-11-10' }, { value: 5, signedDate: '2026-11-02' }]
    expect(totalsFor([], r, week).renewalValue).toBe(80)
    expect(totalsFor([], r, periodFor('month', '2026-11-14')).renewalValue).toBe(85)
  })
  it('deret mingguan per hari (Sen..Min) dan harian per jam WIB', () => {
    const s = seriesFor('week', visits, [{ value: 80, signedDate: '2026-11-10' }], week)
    expect(s.visits).toEqual([1, 0, 0, 0, 0, 1, 0])
    expect(s.renewal[1]).toBe(80)
    expect(s.durationHours[0]).toBe(1)
    const d = seriesFor('day', visits, [], periodFor('day', '2026-11-14'))
    expect(d.visits[10]).toBe(1)
    expect(d.labels).toHaveLength(24)
  })
})
describe('rincian kohort', () => {
  it('sudah diperpanjang / berakhir belum / belum jatuh tempo', () => {
    const c = (id: number, end: string, value: number, prev: number | null = null, signed: string | null = null) => ({ id, schoolId: id, endDate: end, value, previousContractId: prev, type: (prev ? 'RENEWAL' : 'NEW') as 'NEW' | 'RENEWAL', signedDate: signed })
    const rows = [c(1, '2026-06-30', 80), c(2, '2027-06-30', 70, 1, '2026-05-01'), c(3, '2026-03-31', 20), c(4, '2026-12-31', 50)]
    expect(cohortBreakdown(rows, 2026, '2026-11-14')).toEqual({ renewed: { count: 1, amount: 70 }, lapsed: { count: 1, amount: 20 }, pending: { count: 1, amount: 50 } })
  })
})

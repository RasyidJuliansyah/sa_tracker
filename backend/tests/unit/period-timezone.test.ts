import { describe, expect, it } from 'vitest'
import { periodFor } from '../../src/utils/period.js'
import { dateKeyIn, startOfDayUtc } from '../../src/utils/timezone.js'

describe('zona waktu', () => {
  it('17.30 UTC sudah hari berikutnya di WIB', () => {
    expect(dateKeyIn(new Date('2026-11-14T17:30:00Z'), 'WIB')).toBe('2026-11-15')
    expect(dateKeyIn(new Date('2026-11-14T16:59:00Z'), 'WIB')).toBe('2026-11-14')
  })
  it('awal hari WIB = 17.00 UTC hari sebelumnya', () => {
    expect(startOfDayUtc('2026-11-14', 'WIB').toISOString()).toBe('2026-11-13T17:00:00.000Z')
    expect(startOfDayUtc('2026-11-14', 'WIT').toISOString()).toBe('2026-11-13T15:00:00.000Z')
  })
})
describe('periode WIB', () => {
  it('minggu Senin–Minggu', () => {
    const p = periodFor('week', '2026-11-14') // Sabtu
    expect([p.start, p.end]).toEqual(['2026-11-09', '2026-11-15'])
    expect(p.fromUtc.toISOString()).toBe('2026-11-08T17:00:00.000Z')
    expect(p.toUtc.toISOString()).toBe('2026-11-15T17:00:00.000Z')
  })
  it('minggu sebelumnya dan bulan kalender', () => {
    expect(periodFor('week', '2026-11-14', -1).start).toBe('2026-11-02')
    const m = periodFor('month', '2026-02-10')
    expect([m.start, m.end]).toEqual(['2026-02-01', '2026-02-28'])
    expect(periodFor('month', '2026-01-15', -1).start).toBe('2025-12-01')
  })
  it('hari', () => {
    expect(periodFor('day', '2026-11-14').end).toBe('2026-11-14')
  })
})

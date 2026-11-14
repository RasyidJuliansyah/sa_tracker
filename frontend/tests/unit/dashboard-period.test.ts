import { describe, expect, it } from 'vitest'
import { comparisonSentence, inRange, periodRange } from '../../src/components/dashboard/period'

describe('periode dashboard (WIB)', () => {
  it('minggu berjalan Senin sampai Minggu', () => {
    const r = periodRange('week', '2026-11-14') // Sabtu
    expect(r.start).toBe('2026-11-09')
    expect(r.end).toBe('2026-11-15')
    expect(r.label).toBe('9–15 November 2026')
  })
  it('hari Minggu masih masuk minggu yang berakhir di hari itu', () => {
    expect(periodRange('week', '2026-11-15').start).toBe('2026-11-09')
    expect(periodRange('week', '2026-11-16').start).toBe('2026-11-16') // Senin membuka minggu baru
  })
  it('minggu sebelumnya dan berikutnya', () => {
    expect(periodRange('week', '2026-11-14', -1).label).toBe('2–8 November 2026')
    expect(periodRange('week', '2026-11-14', 1).label).toBe('16–22 November 2026')
  })
  it('minggu yang melintasi pergantian bulan dan tahun', () => {
    expect(periodRange('week', '2026-11-01').label).toBe('26 Oktober–1 November 2026')
    expect(periodRange('week', '2026-12-31').label).toBe('28 Desember 2026–3 Januari 2027')
  })
  it('bulan kalender, termasuk Februari dan geser lintas tahun', () => {
    expect(periodRange('month', '2026-11-14')).toMatchObject({ start: '2026-11-01', end: '2026-11-30', label: 'November 2026' })
    expect(periodRange('month', '2028-02-10').end).toBe('2028-02-29')
    expect(periodRange('month', '2026-01-05', -1).label).toBe('Desember 2025')
  })
  it('hari memuat nama hari', () => {
    expect(periodRange('day', '2026-11-14').label).toBe('Sabtu, 14 November 2026')
    expect(periodRange('day', '2026-11-14', -1).start).toBe('2026-11-13')
  })
  it('kalimat pembanding menyebut periode sebelumnya', () => {
    expect(comparisonSentence('week', '2026-11-14')).toBe('Periode dihitung dalam WIB. Setiap angka dibandingkan dengan minggu sebelumnya (2–8 November 2026).')
    expect(comparisonSentence('month', '2026-11-14')).toContain('bulan sebelumnya (Oktober 2026)')
  })
  it('inRange memakai batas inklusif', () => {
    const r = periodRange('week', '2026-11-14')
    expect(inRange('2026-11-09', r)).toBe(true)
    expect(inRange('2026-11-15', r)).toBe(true)
    expect(inRange('2026-11-16', r)).toBe(false)
  })
})

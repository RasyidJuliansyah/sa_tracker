import { describe, expect, it } from 'vitest'
import { formatDate, formatDateLong, formatDuration, formatPercent, formatRupiah, formatRupiahCompact, formatSignedPercent } from '../../src/utils/format'
import { formatClock, wibDateKey } from '../../src/utils/timezone'

describe('format id-ID', () => {
  it('rupiah penuh dan ringkas', () => {
    expect(formatRupiah(156_841_000)).toBe('Rp 156.841.000')
    expect(formatRupiahCompact(156_841_000)).toBe('Rp 156,8 jt')
    expect(formatRupiahCompact(1_250_000_000)).toBe('Rp 1,3 M')
    expect(formatRupiahCompact(500_000)).toBe('Rp 500.000')
  })
  it('persen satu desimal dengan koma', () => {
    expect(formatPercent(39.6)).toBe('39,6%')
    expect(formatPercent(90)).toBe('90,0%')
  })
  it('persen bertanda memakai minus sebenarnya', () => {
    expect(formatSignedPercent(12.5)).toBe('+12,5%')
    expect(formatSignedPercent(-4.2)).toBe('−4,2%')
  })
  it('tanggal menurut WIB', () => {
    expect(formatDate('2026-11-14T00:00:00Z')).toBe('14 November 2026')
    expect(formatDateLong('2026-11-14T00:00:00Z')).toBe('Sabtu, 14 November 2026')
    // 20.00 UTC tanggal 13 sudah 14 November di WIB
    expect(formatDate('2026-11-13T20:00:00Z')).toBe('14 November 2026')
  })
  it('durasi', () => {
    expect(formatDuration(85)).toBe('1 j 25 m')
    expect(formatDuration(25)).toBe('25 m')
    expect(formatDuration(120)).toBe('2 j 0 m')
  })
})

describe('zona waktu', () => {
  it('jam ditampilkan di zona agent dengan label', () => {
    const utc = '2026-11-14T02:15:00Z'
    expect(formatClock(utc, 'WIB')).toBe('09.15 WIB')
    expect(formatClock(utc, 'WITA')).toBe('10.15 WITA')
    expect(formatClock(utc, 'WIT')).toBe('11.15 WIT')
  })
  it('kunci tanggal mengikuti WIB', () => {
    expect(wibDateKey('2026-11-13T20:00:00Z')).toBe('2026-11-14')
  })
})

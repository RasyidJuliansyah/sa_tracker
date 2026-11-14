import { describe, expect, it } from 'vitest'
import { isRunning, validateContractPeriod, validateRenewal } from '../../src/services/contract-rules.js'
import { neutralizeCell, parseCsv, toCsv } from '../../src/utils/csv.js'
import { generateTempPassword } from '../../src/utils/password.js'

describe('kontrak', () => {
  it('berjalan inklusif di kedua ujung', () => {
    const c = { startDate: '2026-01-01', endDate: '2026-12-31' }
    expect(isRunning(c, '2026-01-01')).toBe(true)
    expect(isRunning(c, '2026-12-31')).toBe(true)
    expect(isRunning(c, '2027-01-01')).toBe(false)
  })
  it('berakhir harus setelah mulai', () => {
    expect(() => validateContractPeriod({ startDate: '2026-05-01', endDate: '2026-05-01' }, [])).toThrow()
  })
  it('periode tidak boleh tumpang tindih, bersebelahan boleh', () => {
    const others = [{ id: 1, startDate: '2025-01-01', endDate: '2025-12-31' }]
    expect(() => validateContractPeriod({ startDate: '2025-12-31', endDate: '2026-12-30' }, others)).toThrow()
    expect(() => validateContractPeriod({ startDate: '2026-01-01', endDate: '2026-12-31' }, others)).not.toThrow()
  })
  it('perpanjangan wajib signed_date dan hanya satu', () => {
    expect(() => validateRenewal({ signedDate: null, previousHasRenewal: false })).toThrow()
    expect(() => validateRenewal({ signedDate: '2026-05-01', previousHasRenewal: true })).toThrow()
    expect(() => validateRenewal({ signedDate: '2026-05-01', previousHasRenewal: false })).not.toThrow()
  })
})
describe('csv', () => {
  it('menetralkan sel berbahaya', () => {
    for (const s of ['=1+1', '+1', '-1', '@x', '\tx', '\rx']) expect(neutralizeCell(s)).toBe(`'${s}`)
    expect(neutralizeCell('aman')).toBe('aman')
  })
  it('toCsv: BOM, kutip, netralisasi; parseCsv membaca balik', () => {
    const out = toCsv(['nama', 'catatan'], [['SMA, 1', '=HYPERLINK("x")'], ['b', 'baris\nbaru']])
    expect(out.startsWith('﻿')).toBe(true)
    const back = parseCsv(out)
    expect(back[1]).toEqual(['SMA, 1', `'=HYPERLINK("x")`])
    expect(back[2]).toEqual(['b', 'baris\nbaru'])
  })
})
describe('password sementara', () => {
  it('panjang 12 dengan huruf besar, kecil, angka; acak', () => {
    const a = generateTempPassword(), b = generateTempPassword()
    expect(a).toHaveLength(12)
    expect(a).toMatch(/[A-Z]/); expect(a).toMatch(/[a-z]/); expect(a).toMatch(/\d/)
    expect(a).not.toBe(b)
  })
})

import { currentContract, renewalStatus } from '../../src/services/contract-rules.js'
describe('status perpanjangan', () => {
  const c = (id: number, s: string, e: string, prev: number | null = null) => ({ id, startDate: s, endDate: e, previousContractId: prev })
  it('berjalan > 60 hari = RUNNING, ≤ 60 = ENDING_SOON, lewat = EXPIRED', () => {
    expect(renewalStatus([c(1, '2026-01-01', '2027-06-30')], '2026-11-14')?.kind).toBe('RUNNING')
    expect(renewalStatus([c(1, '2026-01-01', '2027-01-10')], '2026-11-14')?.kind).toBe('ENDING_SOON')
    expect(renewalStatus([c(1, '2025-01-01', '2026-11-13')], '2026-11-14')?.kind).toBe('EXPIRED')
  })
  it('sudah diperpanjang = RENEWED dan kontrak berjalan dipilih', () => {
    const list = [c(1, '2025-12-01', '2026-11-30'), c(2, '2026-12-01', '2027-11-30', 1)]
    expect(currentContract(list, '2026-11-14')?.id).toBe(1)
    expect(renewalStatus(list, '2026-11-14')?.kind).toBe('RENEWED')
    expect(currentContract(list, '2026-12-05')?.id).toBe(2)
  })
  it('tanpa kontrak: null', () => { expect(renewalStatus([], '2026-11-14')).toBeNull() })
})

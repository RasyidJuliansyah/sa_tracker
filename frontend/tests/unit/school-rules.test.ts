import { describe, expect, it } from 'vitest'
import type { MockContract } from '../../src/mocks/school'
import { neutralizeCell, parseCsv, toCsv } from '../../src/components/school/csv'
import { addDays, daysBetween, periodsOverlap, renewalRatio, renewalStatus, suggestRenewalPeriod, validatePeriod, validateRenewal } from '../../src/components/school/contract-rules'
import { previewImport, summarize } from '../../src/components/school/import-rules'
import { parseTargetPercent, targetValue, formatCompactRupiah } from '../../src/components/school/target-rules'

// Fixture lokal (dulu dari mocks/school.ts, dipindah ke sini supaya mocks/*.ts bisa dikosongin).
// Sekolah contoh "Cahaya Ilmu": tiga kontrak berturutan, kontrak terbaru berakhir 47 hari dari 2026-11-14.
const cahaya: MockContract[] = [
  { id: 6, schoolId: 4, label: 'Kontrak 2024', start: '2024-01-01', end: '2024-12-31', value: 54_000_000, signedDate: '2023-12-20', type: 'FIRST', previousContractId: null, note: 'Kontrak pertama' },
  { id: 7, schoolId: 4, label: 'Kontrak 2025', start: '2025-01-01', end: '2025-12-31', value: 54_000_000, signedDate: '2024-12-02', type: 'RENEWAL', previousContractId: 6, note: '' },
  { id: 8, schoolId: 4, label: 'Kontrak 2026', start: '2026-01-01', end: '2026-12-31', value: 60_000_000, signedDate: '2025-12-12', type: 'RENEWAL', previousContractId: 7, note: '' },
]
const base = cahaya.find((c) => c.label === 'Kontrak 2026')!

describe('periode kontrak', () => {
  it('berakhir harus setelah mulai', () => {
    expect(validatePeriod('2026-01-01', '2026-01-01')).not.toBe('')
    expect(validatePeriod('2026-01-01', '2026-12-31')).toBe('')
  })
  it('tumpang tindih inklusif', () => {
    const a = { start: '2026-01-01', end: '2026-12-31' }
    expect(periodsOverlap(a, { start: '2026-12-31', end: '2027-12-30' })).toBe(true)
    expect(periodsOverlap(a, { start: '2027-01-01', end: '2027-12-31' })).toBe(false)
  })
  it('selisih dan tambah hari', () => {
    expect(daysBetween('2026-11-14', '2026-12-31')).toBe(47)
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(suggestRenewalPeriod({ start: '2026-01-01', end: '2026-12-31' })).toEqual({ start: '2027-01-01', end: '2027-12-31' })
  })
})

describe('perpanjangan', () => {
  it('tanggal tanda tangan wajib dan tumpang tindih ditolak', () => {
    const empty = validateRenewal({ signedDate: '', start: '2027-01-01', end: '2027-12-31', value: 1 }, base, cahaya)
    expect(empty.signedDate).toContain('wajib')
    const clash = validateRenewal({ signedDate: '2026-11-20', start: '2026-12-01', end: '2027-12-31', value: 1 }, base, cahaya)
    expect(clash.start).toContain('tumpang tindih')
    const ok = validateRenewal({ signedDate: '2026-11-20', start: '2027-01-01', end: '2027-12-31', value: 66_000_000 }, base, cahaya)
    expect(Object.values(ok).every((v) => v === '')).toBe(true)
  })
  it('satu kontrak satu perpanjangan', () => {
    const k2025 = cahaya.find((c) => c.label === 'Kontrak 2025')!
    expect(validateRenewal({ signedDate: '2026-11-20', start: '2030-01-01', end: '2030-12-31', value: 1 }, k2025, cahaya).form).toContain('sudah punya perpanjangan')
  })
  it('rasio tampilan tidak dibatasi 100', () => {
    expect(renewalRatio(60, 54)).toBeCloseTo(111.11, 1)
    expect(renewalRatio(66, 60)).toBeCloseTo(110, 5)
  })
  it('status perpanjangan sekolah Cahaya Ilmu', () => {
    expect(renewalStatus(cahaya, '2026-11-14')).toEqual({ kind: 'ENDING_SOON', daysLeft: 47 })
    expect(renewalStatus(cahaya, '2027-02-01')?.kind).toBe('EXPIRED')
  })
})

describe('CSV', () => {
  it('menetralkan sel berawalan rumus', () => {
    for (const v of ['=1+1', '+1', '-1', '@SUM(A1)', '\tx', '\rx']) expect(neutralizeCell(v).startsWith("'")).toBe(true)
    expect(neutralizeCell('aman')).toBe('aman')
  })
  it('toCsv memakai BOM dan kutip', () => {
    const out = toCsv(['a', 'b'], [['x,y', '=cmd']])
    expect(out.startsWith('﻿')).toBe(true)
    expect(out).toContain('"x,y",\'=cmd')
  })
  it('parseCsv membaca kutip dan CRLF', () => {
    expect(parseCsv('﻿a,b\r\n"x, y",2\r\n')).toEqual([['a', 'b'], ['x, y', '2']])
  })
})

describe('pratinjau impor', () => {
  const header = 'npsn,nama_sekolah,jenjang,paket,zona_waktu,kota,alamat,pic,kontak_pic,id_lms,tanggal_ttd,tanggal_mulai,tanggal_berakhir,nilai_kontrak'
  const existing = new Set(['111'])
  it('klasifikasi baris valid, diperbarui, dan gagal', () => {
    const csv = [header, '111,A,SD,Dasar,WIB,K,Alamat,Pic,,,,,,', '222,B,SD,Dasar,WIB,K,,,,,2026-01-01,2026-02-01,2027-01-31,1000', '333,C,SMU,Dasar,,,,,,,,,,', ',D,SD,Dasar,,,,,,,,,,', '444,E,SD,Dasar,WIB,K,,,,,2026-01-01,2027-01-01,2026-12-31,5', '222,F,SD,Dasar,,,,,,,,,,'].join('\n')
    const { rows } = previewImport(csv, existing)
    expect(summarize(rows)).toEqual({ total: 6, created: 1, updated: 1, failed: 4 })
    expect(rows.map((r) => r.line)).toEqual([2, 3, 4, 5, 6, 7])
    expect(rows[2]!.message).toContain('"SMU"')
    expect(rows[5]!.message).toContain('ganda')
  })
  it('kolom wajib hilang', () => {
    expect(previewImport('a,b\n1,2', existing).fileError).toContain('Kolom wajib')
  })
})

describe('target retention', () => {
  it('persentase sah', () => {
    expect(parseTargetPercent('65')).toBe(65)
    expect(parseTargetPercent('62,5')).toBe(62.5)
    for (const bad of ['0', '101', 'abc', '', '-5']) expect(parseTargetPercent(bad)).toBeNull()
  })
  it('target nilai dan format ringkas', () => {
    expect(targetValue(65, 1_380_000_000)).toBe(897_000_000)
    expect(formatCompactRupiah(1_380_000_000)).toBe('Rp 1,38 M')
    expect(formatCompactRupiah(806_000_000)).toBe('Rp 806 jt')
  })
})

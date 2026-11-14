import { describe, expect, it } from 'vitest'
import { retentionForAgent, retentionForYear, type ContractRow } from '../../src/services/retention.js'

const JT = 1_000_000
const contracts: ContractRow[] = [
  // Sekolah A (agent C): Rp 80 jt berakhir 2026, diperpanjang Rp 80 jt
  { id: 1, schoolId: 1, endDate: '2026-06-30', value: 80 * JT, previousContractId: null, type: 'NEW', signedDate: '2025-06-01' },
  { id: 2, schoolId: 1, endDate: '2027-06-30', value: 80 * JT, previousContractId: 1, type: 'RENEWAL', signedDate: '2026-05-20' },
  // Sekolah B (agent D): Rp 20 jt, diperpanjang Rp 10 jt
  { id: 3, schoolId: 2, endDate: '2026-08-31', value: 20 * JT, previousContractId: null, type: 'NEW', signedDate: '2025-08-01' },
  { id: 4, schoolId: 2, endDate: '2027-08-31', value: 10 * JT, previousContractId: 3, type: 'RENEWAL', signedDate: '2026-08-15' },
]
const assignments = [
  { schoolId: 1, agentId: 100, sharePercent: 100 },
  { schoolId: 2, agentId: 200, sharePercent: 100 },
]
const today = '2026-11-14'

describe('retention (contoh sekolah A dan B)', () => {
  it('manager: Rp 90 jt dari kohort Rp 100 jt = 90%, target minimal Rp 65 jt, tercapai', () => {
    const r = retentionForYear(contracts, 2026, today)
    expect(r.cohortValue).toBe(100 * JT)
    expect(r.retainedValue).toBe(90 * JT)
    expect(r.percent).toBe(90)
    expect(r.targetValue).toBe(65 * JT)
    expect(r.status).toBe('MET')
  })
  it('agent C 100% tercapai, agent D 50% di bawah target', () => {
    const c = retentionForAgent(contracts, assignments, 100, 2026, today)
    const d = retentionForAgent(contracts, assignments, 200, 2026, today)
    expect(c.percent).toBe(100)
    expect(c.status).toBe('MET')
    expect(d.percent).toBe(50)
    expect(d.status).toBe('BELOW')
  })
  it('tidak dibatasi 100%', () => {
    const up: ContractRow[] = [
      { id: 1, schoolId: 1, endDate: '2026-03-31', value: 10 * JT, previousContractId: null, type: 'NEW', signedDate: null },
      { id: 2, schoolId: 1, endDate: '2027-03-31', value: 15 * JT, previousContractId: 1, type: 'RENEWAL', signedDate: '2026-03-01' },
    ]
    expect(retentionForYear(up, 2026, today).percent).toBe(150)
  })
  it('perpanjangan yang ditandatangani tahun sebelumnya tetap masuk kohort kontrak yang diperpanjang', () => {
    const early: ContractRow[] = [
      { id: 1, schoolId: 1, endDate: '2026-02-28', value: 10 * JT, previousContractId: null, type: 'NEW', signedDate: null },
      { id: 2, schoolId: 1, endDate: '2027-02-28', value: 10 * JT, previousContractId: 1, type: 'RENEWAL', signedDate: '2025-12-20' },
    ]
    expect(retentionForYear(early, 2026, today).retainedValue).toBe(10 * JT)
  })
  it('belum ada perpanjangan ditandatangani = 0 ter-retain', () => {
    const none: ContractRow[] = [{ id: 1, schoolId: 1, endDate: '2026-12-31', value: 10 * JT, previousContractId: null, type: 'NEW', signedDate: null }]
    const r = retentionForYear(none, 2026, today)
    expect(r.retainedValue).toBe(0)
    expect(r.status).toBe('NO_DATA') // belum jatuh tempo dan belum diperpanjang: belum diputuskan
  })
  it('status dari kontrak yang sudah diputuskan: kontrak lewat tempo tanpa perpanjangan menurunkan status', () => {
    const mix: ContractRow[] = [
      { id: 1, schoolId: 1, endDate: '2026-03-31', value: 10 * JT, previousContractId: null, type: 'NEW', signedDate: null }, // lewat, tidak diperpanjang
      { id: 2, schoolId: 2, endDate: '2026-12-31', value: 90 * JT, previousContractId: null, type: 'NEW', signedDate: null }, // belum diputuskan
    ]
    const r = retentionForYear(mix, 2026, today)
    expect(r.decidedValue).toBe(10 * JT)
    expect(r.status).toBe('BELOW')
    expect(r.percent).toBe(0)
  })
  it('porsi penugasan: dua agent 60/40 membagi sekolah', () => {
    const split = [{ schoolId: 1, agentId: 1, sharePercent: 60 }, { schoolId: 1, agentId: 2, sharePercent: 40 }]
    expect(retentionForAgent(contracts, split, 1, 2026, today).cohortValue).toBe(48 * JT)
    expect(retentionForAgent(contracts, split, 2, 2026, today).cohortValue).toBe(32 * JT)
  })
  it('retention sekolah ikut agent yang sedang ditugaskan', () => {
    const moved = [{ schoolId: 1, agentId: 300, sharePercent: 100 }]
    expect(retentionForAgent(contracts, moved, 300, 2026, today).retainedValue).toBe(80 * JT)
  })
  it('kohort kosong: persen null', () => {
    expect(retentionForYear(contracts, 2030, today).percent).toBeNull()
  })
})

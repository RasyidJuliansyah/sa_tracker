import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { VisitError, useAgentVisitsStore } from '@/stores/agent-visits'
import { mockSchools } from '@/mocks/agent'

const fix = { lat: -6.23841, lng: 106.99312, accuracy: 12.4 }

// Fixture lokal (dulu dari mocks/agent.ts, dipindah ke sini supaya mocks/*.ts bisa dikosongin).
// mocks/agent.ts (mockSchools, mockVisits) kosong secara default; store diisi manual di beforeEach.
mockSchools.push({ id: 1, name: 'SMA Bina Insani Bekasi', npsn: '20219874', city: 'Bekasi', assigned: true }, { id: 3, name: 'SMP Gemilang Bogor', npsn: '20231456', city: 'Bogor', assigned: true })

describe('store kunjungan agent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAgentVisitsStore().visits.push({ id: 3, schoolId: 1, schoolName: 'SMA Bina Insani Bekasi', checkInAt: '2026-11-14T02:15:00.000Z', checkOutAt: null, timezone: 'WIB', status: 'ONGOING', report: null, accuracyM: 12 })
  })

  it('awalnya ada satu kunjungan berlangsung', () => {
    expect(useAgentVisitsStore().ongoing?.schoolName).toBe('SMA Bina Insani Bekasi')
  })

  it('check-in ditolak selama masih ada kunjungan berlangsung (satu ONGOING per agent)', () => {
    const s = useAgentVisitsStore()
    expect(() => s.checkIn({ schoolId: 3, hasPhoto: true, location: fix })).toThrow(VisitError)
    expect(s.visits.filter((v) => v.status === 'ONGOING')).toHaveLength(1)
  })

  it('check-out tanpa laporan ditolak dan kunjungan tetap berlangsung', () => {
    const s = useAgentVisitsStore()
    expect(() => s.checkOut('  ')).toThrow('laporan kunjungan wajib diisi')
    expect(s.ongoing).toBeDefined()
  })

  it('check-out dengan laporan menutup kunjungan, lalu check-in baru boleh', () => {
    const s = useAgentVisitsStore()
    const done = s.checkOut('Bertemu wakasek.')
    expect(done.status).toBe('COMPLETED')
    expect(done.checkOutAt).not.toBeNull()
    expect(s.ongoing).toBeUndefined()
    const next = s.checkIn({ schoolId: 3, hasPhoto: true, location: fix })
    expect(next.status).toBe('ONGOING')
    expect(next.timezone).toBe('WIB')
    expect(next.accuracyM).toBe(12)
    expect(s.visits.filter((v) => v.status === 'ONGOING')).toHaveLength(1)
  })

  it('check-in tanpa foto atau tanpa lokasi ditolak', () => {
    const s = useAgentVisitsStore()
    s.checkOut('x')
    expect(() => s.checkIn({ schoolId: 3, hasPhoto: false, location: fix })).toThrow('foto belum diambil')
    expect(() => s.checkIn({ schoolId: 3, hasPhoto: true, location: null })).toThrow('lokasi')
    expect(s.ongoing).toBeUndefined()
  })
})

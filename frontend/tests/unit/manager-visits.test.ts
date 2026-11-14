import { describe, expect, it } from 'vitest'
import { dateRangeKeys, dateRangeLabel } from '@/components/manager/date-range'
import { filterVisits, getVisit, listVisits, validateAgentInput } from '@/services/manager'

const none = { from: null, to: null, agentId: null, schoolId: null, status: null }

describe('rekap manager', () => {
  it('memuat 44 kunjungan: 42 selesai dan 2 berlangsung', async () => {
    const rows = await listVisits(none)
    expect(rows).toHaveLength(44)
    expect(rows.filter((r) => r.status === 'ONGOING')).toHaveLength(2)
  })
  it('tanggal dan hari mengikuti WIB, jam tetap di zona agent', async () => {
    const r = (await getVisit(2494))!
    expect(r.timezone).toBe('WITA')
    expect(r.dateKey).toBe('2026-11-14')
    expect(r.dayLabel).toBe('Sabtu')
  })
  it('durasi kunjungan selesai dihitung dari check-in dan check-out', async () => {
    expect((await getVisit(2492))!.durationMinutes).toBe(85)
  })
  it('filter rentang tanggal, agent, status', async () => {
    const rows = await listVisits(none)
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

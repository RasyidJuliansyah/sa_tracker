import { describe, expect, it } from 'vitest'
import { checkInRejection, checkOutRejection, filterSchools, filterVisitsByRange, findOngoing, formatCoordinates, groupSchoolsForCheckIn, groupVisitsByDay, weekStartKey } from '@/components/agent/visit-rules'
import type { Visit } from '@/mocks/agent'

// Fixture lokal (dulu dari mocks/agent.ts, dipindah ke sini supaya mocks/*.ts bisa dikosongin tanpa menyentuh tes ini).
interface MockSchool { id: number; name: string; npsn: string; city: string; assigned: boolean }
const mockSchools: MockSchool[] = [
  { id: 1, name: 'SMA Bina Insani Bekasi', npsn: '20219874', city: 'Bekasi', assigned: true },
  { id: 3, name: 'SMP Gemilang Bogor', npsn: '20231456', city: 'Bogor', assigned: true },
  { id: 5, name: 'SD Cahaya Ilmu Depok', npsn: '20228801', city: 'Depok', assigned: true },
  { id: 4, name: 'SMK Taruna Jaya Karawang', npsn: '20217735', city: 'Karawang', assigned: true },
  { id: 2, name: 'SMP Nusa Indah Bekasi', npsn: '20219102', city: 'Bekasi', assigned: false },
  { id: 6, name: 'SMA Lentera Jakarta Timur', npsn: '20104417', city: 'Jakarta Timur', assigned: false },
]
const mockVisits: Visit[] = [
  { id: 4, schoolId: 5, schoolName: 'SD Cahaya Ilmu Depok', checkInAt: '2026-11-13T02:00:00.000Z', checkOutAt: '2026-11-13T03:15:00.000Z', timezone: 'WIB', status: 'COMPLETED', report: 'Pendampingan guru kelas 4 membuat paket soal.' },
  { id: 5, schoolId: 6, schoolName: 'SMA Lentera Jakarta Timur', checkInAt: '2026-11-11T06:30:00.000Z', checkOutAt: '2026-11-11T07:20:00.000Z', timezone: 'WIB', status: 'COMPLETED', report: 'Kunjungan perkenalan fitur laporan nilai.' },
  { id: 6, schoolId: 4, schoolName: 'SMK Taruna Jaya Karawang', checkInAt: '2026-11-11T01:45:00.000Z', checkOutAt: '2026-11-11T03:05:00.000Z', timezone: 'WIB', status: 'COMPLETED', report: 'Cek kendala login siswa kelas XI.' },
  { id: 0, schoolId: 1, schoolName: 'SMA Bina Insani Bekasi', checkInAt: '2026-11-02T03:00:00.000Z', checkOutAt: '2026-11-02T04:20:00.000Z', timezone: 'WIB', status: 'COMPLETED', report: 'Sosialisasi fitur tryout ke 12 guru. Sekolah minta jadwal TO bulan Desember.' },
  { id: 3, schoolId: 1, schoolName: 'SMA Bina Insani Bekasi', checkInAt: '2026-11-14T02:15:00.000Z', checkOutAt: null, timezone: 'WIB', status: 'ONGOING', report: null, accuracyM: 12 },
  { id: 2, schoolId: 2, schoolName: 'SMP Nusa Indah Bekasi', checkInAt: '2026-11-13T06:05:00.000Z', checkOutAt: '2026-11-13T07:10:00.000Z', timezone: 'WIB', status: 'COMPLETED', report: 'Demo fitur laporan nilai untuk guru kelas 8.' },
  { id: 1, schoolId: 3, schoolName: 'SMP Gemilang Bogor', checkInAt: '2026-11-12T02:30:00.000Z', checkOutAt: '2026-11-12T04:00:00.000Z', timezone: 'WIB', status: 'COMPLETED', report: 'Pendampingan penggunaan LMS oleh wali kelas.' },
]

const NOW = new Date('2026-11-14T03:40:00.000Z') // Sabtu 14 Nov 2026 10.40 WIB

describe('findOngoing', () => {
  it('menemukan satu kunjungan berlangsung', () => {
    expect(findOngoing(mockVisits)?.schoolName).toBe('SMA Bina Insani Bekasi')
  })
  it('kosong bila semua selesai', () => {
    expect(findOngoing(mockVisits.map((v) => ({ ...v, status: 'COMPLETED' as const })))).toBeUndefined()
  })
})

describe('urutan sekolah di check-in', () => {
  it('sekolah yang ditugaskan di atas, urutan asli terjaga', () => {
    const { assigned, others } = groupSchoolsForCheckIn(mockSchools)
    expect(assigned.map((s) => s.name)).toEqual(['SMA Bina Insani Bekasi', 'SMP Gemilang Bogor', 'SD Cahaya Ilmu Depok', 'SMK Taruna Jaya Karawang'])
    expect(others.map((s) => s.name)).toEqual(['SMP Nusa Indah Bekasi', 'SMA Lentera Jakarta Timur'])
  })
  it('pencarian lewat nama atau NPSN', () => {
    expect(filterSchools(mockSchools, 'gemilang')).toHaveLength(1)
    expect(filterSchools(mockSchools, '20104417')[0]!.name).toBe('SMA Lentera Jakarta Timur')
    expect(filterSchools(mockSchools, '  ')).toHaveLength(mockSchools.length)
  })
})

describe('penolakan check-in', () => {
  it('menolak tanpa foto dan tanpa izin lokasi dengan pesan jelas', () => {
    expect(checkInRejection({ schoolId: 1, hasPhoto: false, location: 'denied' })).toBe('Check-in ditolak: foto belum diambil dan izin lokasi belum diberikan.')
  })
  it('menolak tanpa foto saja', () => {
    expect(checkInRejection({ schoolId: 1, hasPhoto: false, location: 'ok' })).toBe('Check-in ditolak: foto belum diambil.')
  })
  it('menolak lokasi tidak tersedia dan timeout', () => {
    expect(checkInRejection({ schoolId: 1, hasPhoto: true, location: 'unavailable' })).toContain('lokasi tidak tersedia')
    expect(checkInRejection({ schoolId: 1, hasPhoto: true, location: 'timeout' })).toContain('waktu habis')
  })
  it('menolak tanpa sekolah', () => {
    expect(checkInRejection({ schoolId: null, hasPhoto: true, location: 'ok' })).toContain('sekolah belum dipilih')
  })
  it('lolos bila foto dan lokasi ada', () => {
    expect(checkInRejection({ schoolId: 1, hasPhoto: true, location: 'ok' })).toBeNull()
  })
})

describe('penolakan check-out', () => {
  it('menolak laporan kosong atau hanya spasi', () => {
    expect(checkOutRejection('')).toContain('laporan kunjungan wajib diisi')
    expect(checkOutRejection('   \n ')).not.toBeNull()
  })
  it('lolos dengan laporan', () => {
    expect(checkOutRejection('Bertemu wakasek.')).toBeNull()
  })
})

describe('riwayat', () => {
  it('minggu berjalan Senin-Minggu menurut WIB', () => {
    expect(weekStartKey('2026-11-14')).toBe('2026-11-09')
    expect(weekStartKey('2026-11-15')).toBe('2026-11-09')
    expect(weekStartKey('2026-11-09')).toBe('2026-11-09')
  })
  it('filter minggu ini dan bulan ini', () => {
    expect(filterVisitsByRange(mockVisits, 'week', NOW).every((v) => v.checkInAt >= '2026-11-09')).toBe(true)
    expect(filterVisitsByRange(mockVisits, 'week', NOW).some((v) => v.checkInAt.startsWith('2026-11-02'))).toBe(false)
    expect(filterVisitsByRange(mockVisits, 'month', NOW)).toHaveLength(mockVisits.length)
    expect(filterVisitsByRange(mockVisits, 'all', NOW)).toBe(mockVisits)
  })
  it('hari WIB: kunjungan 00.30 WIB dihitung hari itu, bukan hari UTC sebelumnya', () => {
    const v = { ...mockVisits[0]!, checkInAt: '2026-11-13T17:30:00.000Z' } // 14 Nov 00.30 WIB
    expect(groupVisitsByDay([v])[0]!.day).toBe('2026-11-14')
  })
  it('kelompok per hari, terbaru di atas', () => {
    const groups = groupVisitsByDay(mockVisits)
    expect(groups.map((g) => g.day)).toEqual([...groups.map((g) => g.day)].sort().reverse())
    const nov13 = groups.find((g) => g.day === '2026-11-13')!
    expect(nov13.visits.map((v) => v.schoolName)).toEqual(['SMP Nusa Indah Bekasi', 'SD Cahaya Ilmu Depok'])
  })
})

describe('koordinat', () => {
  it('format id-ID dengan minus sebenarnya', () => {
    expect(formatCoordinates(-6.23841, 106.99312)).toBe('−6,23841, 106,99312')
  })
})

// Data tiruan layar manager. Isinya disamakan dengan desain Figma "03 Manager" (hari ini = 14 Nov 2026).
import type { IndoTimezone } from '@/utils/timezone'

export type AgentActiveState = 'ACTIVE' | 'INACTIVE'

export interface MockAgent {
  id: number
  name: string
  email: string
  timezone: IndoTimezone
  schoolCount: number
  active: boolean
  lastLoginLabel: string
}

export interface MockSchoolRef {
  id: number
  name: string
  agentId: number | null // agent yang ditugaskan; null = tidak ditugaskan
  lat: number
  lng: number
}

export interface MockManagerVisit {
  id: number
  agentId: number
  schoolId: number
  checkInAt: string // ISO UTC
  checkOutAt: string | null
  timezone: IndoTimezone // disalin dari zona agent saat check-in
  ongoingMinutes?: number // durasi tampilan untuk kunjungan berlangsung (jam "server" tiruan)
  report: string | null
  accuracyM: number
}

export const initialAgents: MockAgent[] = [
  { id: 4, name: 'Dimas Saputra', email: 'dimas.saputra@skolla.id', timezone: 'WIB', schoolCount: 4, active: true, lastLoginLabel: 'Hari ini, 08.52' },
  { id: 5, name: 'Ayu Lestari', email: 'ayu.lestari@skolla.id', timezone: 'WITA', schoolCount: 6, active: true, lastLoginLabel: 'Hari ini, 07.40' },
  { id: 6, name: 'Yohanes Wenda', email: 'yohanes.wenda@skolla.id', timezone: 'WIT', schoolCount: 5, active: true, lastLoginLabel: 'Kemarin, 16.05' },
  { id: 7, name: 'Bagus Pratama', email: 'bagus.pratama@skolla.id', timezone: 'WIB', schoolCount: 0, active: false, lastLoginLabel: '2 Sep 2026' },
]

export const mockSchools: MockSchoolRef[] = [
  { id: 1, name: 'SMA Bina Insani Bekasi', agentId: 4, lat: -6.2383, lng: 106.9756 },
  { id: 2, name: 'SMP Nusa Indah Bekasi', agentId: 4, lat: -6.2615, lng: 106.9904 },
  { id: 3, name: 'SD Cahaya Ilmu Depok', agentId: 4, lat: -6.4025, lng: 106.7942 },
  { id: 4, name: 'SMP Gemilang Bogor', agentId: 4, lat: -6.5971, lng: 106.806 },
  { id: 5, name: 'SMA Lentera Jakarta Timur', agentId: null, lat: -6.2250, lng: 106.9004 },
  { id: 6, name: 'SMA Mutiara Makassar', agentId: 5, lat: -5.1477, lng: 119.4327 },
  { id: 7, name: 'SMP Tunas Bangsa Balikpapan', agentId: 5, lat: -1.2379, lng: 116.8529 },
  { id: 8, name: 'SMK Taruna Jaya Balikpapan', agentId: 5, lat: -1.2654, lng: 116.8312 },
  { id: 9, name: 'SMP Cenderawasih Jayapura', agentId: 6, lat: -2.5337, lng: 140.7181 },
  { id: 10, name: 'SD Pelangi Sorong', agentId: 6, lat: -0.8762, lng: 131.2558 },
]

const OFFSET: Record<IndoTimezone, number> = { WIB: 7, WITA: 8, WIT: 9 }

/** Jam dinding di zona agent ("09.15") menjadi ISO UTC. */
function at(dateKey: string, clock: string, tz: IndoTimezone): string {
  const [h, m] = clock.split('.').map(Number)
  const [y, mo, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y!, mo! - 1, d!, h! - OFFSET[tz], m!)).toISOString()
}

const DEPOK_REPORT =
  'Bertemu Pak Hendra (kepala sekolah) dan 4 wali kelas. Penggunaan LMS di kelas 4–6 sudah rutin, kelas 1–3 masih jarang karena guru belum terbiasa membuat tugas. Sekolah minta pelatihan singkat untuk guru kelas rendah sebelum semester genap. Kontrak berakhir 31 Des 2026; kepala sekolah menyampaikan rencana perpanjangan, menunggu rapat yayasan minggu depan.'
const GENERIC_REPORTS = [
  'Bertemu wakil kepala sekolah dan operator LMS. Penggunaan LMS stabil, guru minta contoh penugasan berbasis kuis.',
  'Pendampingan guru mata pelajaran. Beberapa guru belum memakai fitur rekap nilai, dijadwalkan sesi lanjutan.',
  'Cek kendala akses siswa. Sebagian siswa lupa kata sandi, operator sekolah sudah dibantu reset massal.',
  'Diskusi rencana perpanjangan kontrak dengan kepala sekolah. Sekolah puas dengan layanan, menunggu keputusan yayasan.',
]

type Row = [id: number, agentId: number, schoolId: number, date: string, inClock: string, outClock: string | null, ongoingMinutes?: number]
const head: Row[] = [
  [2493, 4, 1, '2026-11-14', '09.15', null, 85],
  [2494, 5, 6, '2026-11-14', '10.05', null, 35],
  [2492, 6, 9, '2026-11-13', '13.20', '14.45'],
  [2491, 4, 2, '2026-11-13', '13.05', '14.10'],
  [2490, 5, 7, '2026-11-13', '09.10', '10.30'],
  [2489, 4, 3, '2026-11-13', '09.00', '10.15'],
  [2488, 4, 4, '2026-11-12', '09.30', '11.00'],
  [2487, 6, 10, '2026-11-12', '10.40', '11.55'],
  [2486, 5, 8, '2026-11-11', '08.30', '10.10'],
  [2485, 4, 5, '2026-11-11', '13.30', '14.20'],
]

const agentById = (id: number) => initialAgents.find((a) => a.id === id)!
const accuracyFor = (schoolId: number) => (schoolId === 3 ? 9 : 6 + ((schoolId * 7) % 18))

// Tiga puluh empat baris sisanya dibangkitkan tetap (tanpa acak) supaya total 44 (42 selesai, 2 berlangsung).
const days: [string, number][] = [['2026-11-11', 2], ['2026-11-10', 5], ['2026-11-09', 5], ['2026-11-06', 5], ['2026-11-05', 5], ['2026-11-04', 4], ['2026-11-03', 4], ['2026-11-02', 4]]
const starts = ['08.30', '09.00', '09.30', '10.00', '13.00']
const lengths = [45, 60, 75, 90, 100]
const plus = (clock: string, minutes: number) => {
  const [h, m] = clock.split('.').map(Number)
  const t = h! * 60 + m! + minutes
  return `${String(Math.floor(t / 60)).padStart(2, '0')}.${String(t % 60).padStart(2, '0')}`
}
const activeAgents = [4, 5, 6]
const generated: Row[] = []
let n = 0
for (const [date, count] of days) {
  for (let i = 0; i < count; i++, n++) {
    const agentId = activeAgents[n % 3]!
    const schools = mockSchools.filter((s) => s.agentId === agentId)
    const school = schools[(n + i) % schools.length]!
    const start = starts[(n * 3 + i) % starts.length]!
    generated.push([2484 - n, agentId, school.id, date, start, plus(start, lengths[(n * 2 + 1) % lengths.length]!)])
  }
}

export const initialVisits: MockManagerVisit[] = [...head, ...generated].map(([id, agentId, schoolId, date, inClock, outClock, ongoingMinutes]) => {
  const timezone = agentById(agentId).timezone
  const done = outClock !== null
  return {
    id, agentId, schoolId, timezone,
    checkInAt: at(date, inClock, timezone),
    checkOutAt: done ? at(date, outClock, timezone) : null,
    ongoingMinutes,
    report: done ? (schoolId === 3 && date === '2026-11-13' ? DEPOK_REPORT : GENERIC_REPORTS[id % GENERIC_REPORTS.length]!) : null,
    accuracyM: accuracyFor(schoolId),
  }
})

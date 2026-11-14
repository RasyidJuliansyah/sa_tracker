import type { Visit } from '@/mocks/agent'
import { wibDateKey } from '@/utils/timezone'

// Aturan murni kunjungan agent (tanpa Vue/Pinia supaya mudah dites).

export interface SchoolLite {
  id: number
  name: string
  npsn: string
  city: string
  assigned: boolean
}

export type LocationState = 'idle' | 'loading' | 'ok' | 'denied' | 'unavailable' | 'timeout'

/** Satu agent hanya boleh punya satu kunjungan ONGOING. */
export function findOngoing(visits: Visit[]): Visit | undefined {
  return visits.find((v) => v.status === 'ONGOING')
}

/** Sekolah yang ditugaskan di atas, sisanya di bawah. Urutan asli dipertahankan di tiap kelompok. */
export function groupSchoolsForCheckIn(schools: SchoolLite[]): { assigned: SchoolLite[]; others: SchoolLite[] } {
  return { assigned: schools.filter((s) => s.assigned), others: schools.filter((s) => !s.assigned) }
}

/** Cari berdasarkan nama sekolah atau NPSN, tanpa membedakan huruf besar kecil. */
export function filterSchools(schools: SchoolLite[], query: string): SchoolLite[] {
  const q = query.trim().toLowerCase()
  if (!q) return schools
  return schools.filter((s) => s.name.toLowerCase().includes(q) || s.npsn.includes(q))
}

export interface CheckInInput {
  schoolId: number | null
  hasPhoto: boolean
  location: LocationState
}

/** Pesan penolakan check-in, atau null bila boleh. Foto dan lokasi wajib. */
export function checkInRejection(input: CheckInInput): string | null {
  if (input.schoolId === null) return 'Check-in ditolak: sekolah belum dipilih.'
  const missing: string[] = []
  if (!input.hasPhoto) missing.push('foto belum diambil')
  if (input.location === 'denied') missing.push('izin lokasi belum diberikan')
  else if (input.location === 'unavailable') missing.push('lokasi tidak tersedia di perangkat ini')
  else if (input.location === 'timeout') missing.push('lokasi belum didapat (waktu habis)')
  else if (input.location !== 'ok') missing.push('lokasi belum didapat')
  return missing.length ? `Check-in ditolak: ${missing.join(' dan ')}.` : null
}

/** Check-out wajib menyertakan laporan teks (spasi saja tidak dihitung). */
export function checkOutRejection(report: string): string | null {
  return report.trim() ? null : 'Check-out ditolak: laporan kunjungan wajib diisi.'
}

/** "−6,23841, 106,99312" */
export function formatCoordinates(lat: number, lng: number): string {
  const f = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 5, maximumFractionDigits: 5 }).replace('-', '−')
  return `${f(lat)}, ${f(lng)}`
}

export type HistoryRange = 'all' | 'week' | 'month'

/** Senin dari minggu yang memuat tanggal WIB (yyyy-mm-dd), minggu Senin-Minggu. */
export function weekStartKey(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`)
  const back = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}

/** Saring kunjungan menurut hari WIB: semua, minggu berjalan (Senin-Minggu), atau bulan kalender berjalan. */
export function filterVisitsByRange(visits: Visit[], range: HistoryRange, now: Date): Visit[] {
  if (range === 'all') return visits
  const today = wibDateKey(now)
  if (range === 'month') return visits.filter((v) => wibDateKey(v.checkInAt).slice(0, 7) === today.slice(0, 7))
  const start = weekStartKey(today)
  const end = new Date(`${start}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + 6)
  const endKey = end.toISOString().slice(0, 10)
  return visits.filter((v) => {
    const k = wibDateKey(v.checkInAt)
    return k >= start && k <= endKey
  })
}

/** Kelompokkan per hari WIB, hari terbaru di atas dan kunjungan terbaru di atas dalam hari. */
export function groupVisitsByDay(visits: Visit[]): { day: string; visits: Visit[] }[] {
  const sorted = [...visits].sort((a, b) => b.checkInAt.localeCompare(a.checkInAt))
  const groups: { day: string; visits: Visit[] }[] = []
  for (const v of sorted) {
    const day = wibDateKey(v.checkInAt)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.visits.push(v)
    else groups.push({ day, visits: [v] })
  }
  return groups
}

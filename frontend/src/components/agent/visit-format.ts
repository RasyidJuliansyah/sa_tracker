import { IANA_ZONE, formatClock } from '@/utils/timezone'
import { formatDuration } from '@/utils/format'
import type { Visit } from '@/mocks/agent'

const MS_PER_MINUTE = 60_000

/** "Sab, 14 Nov" menurut WIB (tanggal rekap selalu WIB). */
export function formatVisitDay(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: IANA_ZONE.WIB }).format(new Date(iso))
}

export function visitMinutes(visit: Visit, now: Date): number {
  const end = visit.checkOutAt ? new Date(visit.checkOutAt) : now
  return Math.max(0, (end.getTime() - new Date(visit.checkInAt).getTime()) / MS_PER_MINUTE)
}

/** "09.15 WIB" untuk kunjungan berjalan, "13.05–14.10 WIB" untuk yang selesai; zona = zona agent pada kunjungan. */
export function formatVisitClockRange(visit: Visit): string {
  const start = formatClock(visit.checkInAt, visit.timezone)
  if (!visit.checkOutAt) return start
  const end = formatClock(visit.checkOutAt, visit.timezone)
  return `${start.replace(` ${visit.timezone}`, '')}–${end}`
}

/** Baris ringkas: "Jum, 13 Nov · 13.05–14.10 WIB · 1 j 5 m" atau "Sab, 14 Nov · 09.15 WIB · berjalan". */
export function formatVisitMeta(visit: Visit, now: Date): string {
  const tail = visit.status === 'ONGOING' ? 'berjalan' : formatDuration(visitMinutes(visit, now))
  return `${formatVisitDay(visit.checkInAt)} · ${formatVisitClockRange(visit)} · ${tail}`
}

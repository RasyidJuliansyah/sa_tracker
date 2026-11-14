import type { ChipTone } from '@/components/StatusChip.vue'
import type { RenewalStatus } from './contract-rules'

const ID = 'id-ID'
const utcDay = (iso: string) => new Date(`${iso}T00:00:00Z`)
const dayFmt = new Intl.DateTimeFormat(ID, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const dayMonthFmt = new Intl.DateTimeFormat(ID, { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** 1 Jan 2026 dari tanggal 'YYYY-MM-DD' (tanggal kalender, tanpa konversi zona). */
export function formatDay(iso: string): string {
  return dayFmt.format(utcDay(iso))
}

/** 1 Jan – 31 Des 2026 bila setahun yang sama, selain itu 1 Okt 2025 – 30 Sep 2026. */
export function formatPeriod(start: string, end: string): string {
  return start.slice(0, 4) === end.slice(0, 4)
    ? `${dayMonthFmt.format(utcDay(start))} – ${formatDay(end)}`
    : `${formatDay(start)} – ${formatDay(end)}`
}

/** 13 Nov 2026, 10.15 menurut WIB. */
export function formatDateTimeWib(iso: string): string {
  const date = new Intl.DateTimeFormat(ID, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso))
  const time = new Intl.DateTimeFormat(ID, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date(iso))
  return `${date}, ${time.replace(':', '.')}`
}

export const initials = (name: string) => name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

/** Angka tanpa awalan Rp, untuk field nilai kontrak: 42.000.000. */
export const formatDigits = (n: number | null) => (n ? n.toLocaleString(ID) : '')
export const parseDigits = (s: string) => Number(s.replace(/\D/g, '')) || 0

export interface StatusLabel { label: string; tone: ChipTone }
/** Label kolom Status perpanjangan di daftar sekolah. */
export function listStatusLabel(status: RenewalStatus | null): StatusLabel {
  if (!status) return { label: 'Belum ada kontrak', tone: 'neutral' }
  switch (status.kind) {
    case 'RENEWED': return { label: 'Sudah diperpanjang', tone: 'success' }
    case 'EXPIRED': return { label: 'Berakhir, belum diperpanjang', tone: 'error' }
    case 'ENDING_SOON': return { label: `Berakhir ${status.daysLeft} hari lagi`, tone: 'warning' }
    default: return { label: 'Berjalan', tone: 'info' }
  }
}
/** Label chip pada kartu Kontrak berjalan di halaman sekolah. */
export function detailStatusLabel(status: RenewalStatus | null): StatusLabel {
  if (status?.kind === 'ENDING_SOON') return { label: 'Belum diperpanjang', tone: 'warning' }
  return listStatusLabel(status)
}

// Validasi form Tambah sekolah. NPSN unik; kontrak pertama wajib; berakhir harus setelah mulai.
import { validatePeriod } from './contract-rules'

export interface SchoolFormValues {
  name: string; npsn: string; lmsId: string; city: string; level: string | null; pkg: string | null; timezone: string | null
  coopStart: string; coopEnd: string
  signedDate: string; start: string; end: string; value: number
}
export type SchoolFormErrors = Partial<Record<'name' | 'npsn' | 'lmsId' | 'city' | 'level' | 'pkg' | 'timezone' | 'coopStart' | 'coopEnd' | 'signedDate' | 'start' | 'end' | 'value', string>>

/** `npsnOwnerName` = nama sekolah yang sudah memakai NPSN itu (atau undefined bila bebas). */
export function validateSchoolForm(v: SchoolFormValues, npsnOwnerName: string | undefined): SchoolFormErrors {
  const e: SchoolFormErrors = {}
  if (!v.name.trim()) e.name = 'Nama sekolah wajib diisi'
  if (!v.npsn.trim()) e.npsn = 'NPSN wajib diisi'
  else if (!/^\d+$/.test(v.npsn.trim())) e.npsn = 'NPSN hanya berisi angka'
  else if (npsnOwnerName) e.npsn = `NPSN ${v.npsn.trim()} sudah dipakai ${npsnOwnerName}`
  if (v.lmsId.trim() && !/^\d+$/.test(v.lmsId.trim())) e.lmsId = 'ID LMS harus angka'
  if (!v.city.trim()) e.city = 'Kota wajib diisi'
  if (!v.level) e.level = 'Jenjang wajib dipilih'
  if (!v.pkg) e.pkg = 'Paket wajib dipilih'
  if (!v.timezone) e.timezone = 'Zona waktu wajib dipilih'
  if (!v.coopStart) e.coopStart = 'Tanggal mulai kerja sama wajib diisi'
  if (!v.coopEnd) e.coopEnd = 'Tanggal berakhir wajib diisi'
  else if (v.coopStart && validatePeriod(v.coopStart, v.coopEnd)) e.coopEnd = validatePeriod(v.coopStart, v.coopEnd)
  if (!v.signedDate) e.signedDate = 'Tanggal tanda tangan wajib diisi'
  if (!v.start) e.start = 'Tanggal mulai wajib diisi'
  if (!v.end) e.end = 'Tanggal berakhir wajib diisi'
  else if (v.start && validatePeriod(v.start, v.end)) e.end = validatePeriod(v.start, v.end)
  if (!v.value || v.value <= 0) e.value = 'Nilai kontrak wajib diisi'
  return e
}

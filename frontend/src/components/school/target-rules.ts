// Aturan murni layar Target retention. Rumus retention kohort tahunan ada di backend.
import { DEFAULT_TARGET } from '@/mocks/school'

/** Persentase target sah: angka lebih dari 0 dan paling banyak 100. Koma desimal diterima. Mengembalikan null bila tidak sah. */
export function parseTargetPercent(input: string): number | null {
  const text = input.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(text)) return null
  const n = Number(text)
  return n > 0 && n <= 100 ? n : null
}

/** Nilai target = persentase target × total nilai kontrak kohort (angka sederhana untuk tampilan). */
export function targetValue(percent: number, cohortValue: number): number {
  return Math.round((cohortValue * percent) / 100)
}

/** Rp 1,38 M, Rp 806 jt, Rp 0. Dua desimal untuk miliar supaya sama dengan Figma. */
export function formatCompactRupiah(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  return `Rp ${value.toLocaleString('id-ID')}`
}

export const isDefaultPercent = (percent: number) => percent === DEFAULT_TARGET

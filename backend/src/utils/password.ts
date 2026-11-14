import { randomInt } from 'node:crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789' // tanpa karakter mirip (0/O, 1/l/I)

/** Password sementara acak (CSPRNG), minimal satu huruf besar, kecil, dan angka. */
export function generateTempPassword(length = 12): string {
  for (;;) {
    const p = Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
    if (/[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p)) return p
  }
}

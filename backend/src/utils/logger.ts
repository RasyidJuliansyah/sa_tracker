type Level = 'info' | 'warn' | 'error'

// Log aplikasi: satu baris JSON per kejadian ke stdout.
// Jangan pernah mengirim password, token, isi foto, atau koordinat GPS lengkap ke sini.
export function log(level: Level, message: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...fields })
  process.stdout.write(line + '\n')
}

import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'
const jwtSecret = process.env.JWT_SECRET ?? ''
if (isProd && jwtSecret.length < 32) throw new Error('JWT_SECRET wajib diisi (minimal 32 karakter) di produksi')

export const config = {
  port: Number(process.env.PORT ?? 3011),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3010',
  // Di luar produksi dipakai nilai dev agar server tetap jalan; produksi wajib dari .env.
  jwtSecret: jwtSecret || 'dev-only-secret-ganti-di-env-0123456789',
  cookieName: 'sa_session',
  sessionHours: 8,
  secureCookie: isProd,
}

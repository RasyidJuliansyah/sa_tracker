import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT ?? 3011),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3010',
}

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { config } from '../config.js'
import { authenticate } from '../middleware/auth.js'
import { login } from '../services/auth.service.js'

const loginBody = z.object({ email: z.string().trim().email().max(191), password: z.string().min(1).max(200) })

// Batas percobaan login per IP: 10 kali per 15 menit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: Number(process.env.LOGIN_RATE_LIMIT ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.' } })
  },
})

export const authRouter = Router()

authRouter.post('/auth/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginBody.parse(req.body)
    const { token, user } = await login(email, password, { ip: req.ip, userAgent: req.headers['user-agent'] })
    res.cookie(config.cookieName, token, {
      httpOnly: true, sameSite: 'lax', secure: config.secureCookie, path: '/', maxAge: config.sessionHours * 3_600_000,
    })
    res.json({ user })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie(config.cookieName, { httpOnly: true, sameSite: 'lax', secure: config.secureCookie, path: '/' })
  res.status(204).end()
})

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user })
})

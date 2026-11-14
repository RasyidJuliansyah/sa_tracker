import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'
import { log } from '../utils/logger.js'

declare module 'express-serve-static-core' {
  interface Request { requestId?: string }
}

// Satu baris log per request. Hanya metode, path (tanpa query), status, durasi: tanpa body/header.
export const requestLog: RequestHandler = (req, res, next) => {
  const started = Date.now()
  req.requestId = randomUUID()
  res.setHeader('X-Request-Id', req.requestId)
  res.on('finish', () => {
    log('info', 'request', { requestId: req.requestId, method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - started })
  })
  next()
}

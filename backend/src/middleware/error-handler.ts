import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors.js'
import { log } from '../utils/logger.js'

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Data tidak ditemukan.' } })
}

// Bentuk galat seragam: { error: { code, message, details? } }. Detail galat server tidak dibocorkan.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    res.status(400).json({ error: { code: 'VALIDATION', message: 'Data yang dikirim tidak valid.', details } })
    return
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } })
    return
  }
  log('error', 'unhandled', { requestId: req.requestId, error: err instanceof Error ? err.message : String(err) })
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Terjadi kesalahan di server.' } })
}

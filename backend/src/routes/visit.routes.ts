import { Router, type Request } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { config } from '../config.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { photoAbsolutePath } from '../services/photo-storage.js'
import { checkIn, checkOut, getVisit, listVisits, photoPathFor } from '../services/visit.service.js'
import { dateKey, idParam, pageQuery } from '../validators/common.js'

const ctx = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] })
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxPhotoBytes, files: 1 } })

const checkInBody = z.object({
  schoolId: z.coerce.number().int().positive(),
  lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().min(0).max(100000).optional().nullable().transform((v) => v ?? null),
})
const listQuery = pageQuery.extend({
  from: dateKey.optional(), to: dateKey.optional(), agentId: z.coerce.number().int().positive().optional(),
  schoolId: z.coerce.number().int().positive().optional(), status: z.enum(['ONGOING', 'DONE']).optional(),
})

export const visitRouter = Router()
visitRouter.use('/visits', authenticate)

visitRouter.post('/visits/check-in', requireRole('AGENT'), upload.single('photo'), async (req, res, next) => {
  try { res.status(201).json({ visit: await checkIn(req.user!, checkInBody.parse(req.body), req.file?.buffer, ctx(req)) }) } catch (e) { next(e) }
})
visitRouter.post('/visits/:id/check-out', requireRole('AGENT'), async (req, res, next) => {
  try {
    const { report } = z.object({ report: z.string().max(5000) }).parse(req.body)
    res.json({ visit: await checkOut(req.user!, idParam.parse(req.params).id, report, ctx(req)) })
  } catch (e) { next(e) }
})
visitRouter.get('/visits', async (req, res, next) => {
  try { res.json(await listVisits(req.user!, listQuery.parse(req.query))) } catch (e) { next(e) }
})
visitRouter.get('/visits/:id', async (req, res, next) => {
  try { res.json({ visit: await getVisit(req.user!, idParam.parse(req.params).id) }) } catch (e) { next(e) }
})
// Foto hanya lewat rute ini: cek login, peran, dan kepemilikan.
visitRouter.get('/visits/:id/photo', async (req, res, next) => {
  try {
    const rel = await photoPathFor(req.user!, idParam.parse(req.params).id)
    const abs = photoAbsolutePath(rel)
    const ext = rel.split('.').pop()
    res.setHeader('Cache-Control', 'private, max-age=0, no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.type(ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg')
    res.sendFile(abs, (err) => { if (err) next(err) })
  } catch (e) { next(e) }
})

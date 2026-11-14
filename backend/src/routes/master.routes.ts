import { Router, type Request } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createMaster, listMaster, updateMaster, type MasterKind } from '../services/master.service.js'
import { AppError } from '../utils/errors.js'
import { idParam } from '../validators/common.js'

const ctx = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] })
const nameBody = z.object({ name: z.string().trim().min(1).max(100) })
const patchBody = z.object({ name: z.string().trim().min(1).max(100).optional(), active: z.boolean().optional() }).strict()
const kind = (req: Request): MasterKind => {
  if (req.params.kind !== 'jenjang' && req.params.kind !== 'packages') throw new AppError('NOT_FOUND', 'Data tidak ditemukan.')
  return req.params.kind
}

export const masterRouter = Router()
masterRouter.use('/master/:kind', authenticate)

// Baca: semua peran login (dipakai dropdown). Ubah: admin.
masterRouter.get('/master/:kind', async (req, res, next) => {
  try { res.json({ items: await listMaster(kind(req)) }) } catch (e) { next(e) }
})
masterRouter.post('/master/:kind', requireRole('ADMIN'), async (req, res, next) => {
  try { res.status(201).json({ item: await createMaster(req.user!, kind(req), nameBody.parse(req.body).name, ctx(req)) }) } catch (e) { next(e) }
})
masterRouter.patch('/master/:kind/:id', requireRole('ADMIN'), async (req, res, next) => {
  try { res.json({ item: await updateMaster(req.user!, kind(req), idParam.parse(req.params).id, patchBody.parse(req.body), ctx(req)) }) } catch (e) { next(e) }
})

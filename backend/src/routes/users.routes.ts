import { Router, type Request } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createUser, listUsers, resetPassword, updateUser } from '../services/users.service.js'
import { idParam, roleEnum, timezoneEnum } from '../validators/common.js'

const ctx = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] })
const createBody = z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().email().max(191), role: roleEnum, timezone: timezoneEnum })
const updateBody = z.object({
  name: z.string().trim().min(1).max(120).optional(), email: z.string().trim().email().max(191).optional(),
  role: roleEnum.optional(), timezone: timezoneEnum.optional(), isActive: z.boolean().optional(),
}).strict()
const listQuery = z.object({ query: z.string().max(100).optional(), role: roleEnum.optional(), status: z.enum(['ACTIVE', 'MUST_CHANGE_PASSWORD', 'INACTIVE']).optional() })

export const usersRouter = Router()
usersRouter.use('/users', authenticate)

usersRouter.get('/users', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try { res.json({ items: await listUsers(req.user!, listQuery.parse(req.query)) }) } catch (e) { next(e) }
})
usersRouter.post('/users', requireRole('ADMIN'), async (req, res, next) => {
  try { res.status(201).json(await createUser(req.user!, createBody.parse(req.body), ctx(req))) } catch (e) { next(e) }
})
usersRouter.patch('/users/:id', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try { res.json({ account: await updateUser(req.user!, idParam.parse(req.params).id, updateBody.parse(req.body), ctx(req)) }) } catch (e) { next(e) }
})
usersRouter.post('/users/:id/reset-password', requireRole('ADMIN'), async (req, res, next) => {
  try { res.json(await resetPassword(req.user!, idParam.parse(req.params).id, ctx(req))) } catch (e) { next(e) }
})

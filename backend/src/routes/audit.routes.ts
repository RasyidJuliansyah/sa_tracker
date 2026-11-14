import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { listAudit } from '../services/audit-read.service.js'
import { dateKey, pageQuery } from '../validators/common.js'

const query = pageQuery.extend({
  entityType: z.string().max(50).optional(), entityId: z.coerce.number().int().positive().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DEACTIVATE', 'ASSIGN', 'UNASSIGN', 'CHECK_IN', 'CHECK_OUT', 'LOGIN', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'IMPORT', 'EXPORT']).optional(),
  actorId: z.coerce.number().int().positive().optional(), from: dateKey.optional(), to: dateKey.optional(),
})

export const auditRouter = Router()
auditRouter.get('/audit-logs', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try { res.json(await listAudit(query.parse(req.query))) } catch (e) { next(e) }
})

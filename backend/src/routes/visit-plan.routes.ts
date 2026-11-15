import { Router, type Request } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { cancelPlan, createPlan, getPlan, listPlans } from '../services/visit-plan.service.js'
import { PURPOSE_MAX } from '../services/visit-plan-rules.js'
import { dateKey, idParam } from '../validators/common.js'

const ctx = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] })

const createBody = z.object({
  agentId: z.coerce.number().int().positive().optional(), // diabaikan untuk AGENT
  schoolId: z.coerce.number().int().positive(),
  planDate: dateKey,
  purpose: z.string().min(1).max(PURPOSE_MAX),
})
const listQuery = z.object({
  from: dateKey.optional(),
  to: dateKey.optional(),
  agentId: z.coerce.number().int().positive().optional(),
  schoolId: z.coerce.number().int().positive().optional(),
  source: z.enum(['SELF', 'MANAGER']).optional(),
  upcoming: z.enum(['true', 'false']).optional().transform((v) => (v === undefined ? undefined : v === 'true')),
})

export const visitPlanRouter = Router()
visitPlanRouter.use('/visit-plans', authenticate)

visitPlanRouter.get('/visit-plans', async (req, res, next) => {
  try { res.json(await listPlans(req.user!, listQuery.parse(req.query))) } catch (e) { next(e) }
})
visitPlanRouter.post('/visit-plans', requireRole('AGENT', 'MANAGER', 'ADMIN'), async (req, res, next) => {
  try { res.status(201).json({ plan: await createPlan(req.user!, createBody.parse(req.body), ctx(req)) }) } catch (e) { next(e) }
})
visitPlanRouter.get('/visit-plans/:id', async (req, res, next) => {
  try { res.json({ plan: await getPlan(req.user!, idParam.parse(req.params).id) }) } catch (e) { next(e) }
})
visitPlanRouter.post('/visit-plans/:id/cancel', requireRole('AGENT', 'MANAGER', 'ADMIN'), async (req, res, next) => {
  try { res.json({ plan: await cancelPlan(req.user!, idParam.parse(req.params).id, ctx(req)) }) } catch (e) { next(e) }
})

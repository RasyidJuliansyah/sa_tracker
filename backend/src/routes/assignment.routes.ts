import { Router, type Request } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { assignSchool, listAssignments } from '../services/assignment.service.js'
import { listTargets, saveTarget } from '../services/target.service.js'
import { idParam } from '../validators/common.js'

const ctx = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] })
export const assignmentRouter = Router()
const guard = [authenticate, requireRole('ADMIN', 'MANAGER')]

assignmentRouter.get('/assignments', ...guard, async (req, res, next) => {
  try { res.json(await listAssignments(req.user!)) } catch (e) { next(e) }
})
assignmentRouter.put('/schools/:id/assignment', ...guard, async (req, res, next) => {
  try {
    const { agentId } = z.object({ agentId: z.number().int().positive() }).parse(req.body)
    res.json(await assignSchool(req.user!, idParam.parse(req.params).id, agentId, ctx(req)))
  } catch (e) { next(e) }
})
assignmentRouter.get('/retention-targets', ...guard, async (_req, res, next) => {
  try { res.json({ items: await listTargets() }) } catch (e) { next(e) }
})
assignmentRouter.put('/retention-targets/:year', ...guard, async (req, res, next) => {
  try {
    const year = z.coerce.number().int().min(2000).max(2100).parse(req.params.year)
    const { targetPercent } = z.object({ targetPercent: z.number() }).parse(req.body)
    res.json({ items: await saveTarget(req.user!, year, targetPercent, ctx(req)) })
  } catch (e) { next(e) }
})

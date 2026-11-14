import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { agentDashboard, managerDashboard } from '../services/dashboard.service.js'

const query = z.object({ period: z.enum(['day', 'week', 'month']).default('week'), offset: z.coerce.number().int().min(-120).max(24).default(0) })

export const dashboardRouter = Router()
dashboardRouter.get('/dashboard/manager', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try { const q = query.parse(req.query); res.json(await managerDashboard(q.period, q.offset)) } catch (e) { next(e) }
})
dashboardRouter.get('/dashboard/agent', authenticate, requireRole('AGENT'), async (req, res, next) => {
  try { const q = query.parse(req.query); res.json(await agentDashboard(req.user!.id, q.period, q.offset)) } catch (e) { next(e) }
})

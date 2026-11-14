import { Router, type Request } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { addRenewal, createSchool, getSchool, listSchools, schoolChanges, updateSchool } from '../services/school.service.js'
import { idParam } from '../validators/common.js'
import { createSchoolBody, listSchoolQuery, renewalBody, updateSchoolBody } from '../validators/school.js'

const ctx = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] })
export const schoolRouter = Router()
schoolRouter.use('/schools', authenticate)

schoolRouter.get('/schools', async (req, res, next) => {
  try { res.json(await listSchools(req.user!, listSchoolQuery.parse(req.query))) } catch (e) { next(e) }
})
schoolRouter.post('/schools', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try { res.status(201).json(await createSchool(req.user!, createSchoolBody.parse(req.body), ctx(req))) } catch (e) { next(e) }
})
schoolRouter.get('/schools/:id', async (req, res, next) => {
  try { res.json(await getSchool(req.user!, idParam.parse(req.params).id)) } catch (e) { next(e) }
})
schoolRouter.patch('/schools/:id', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try { res.json(await updateSchool(req.user!, idParam.parse(req.params).id, updateSchoolBody.parse(req.body) as never, ctx(req))) } catch (e) { next(e) }
})
schoolRouter.get('/schools/:id/changes', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try { res.json({ items: await schoolChanges(idParam.parse(req.params).id) }) } catch (e) { next(e) }
})
schoolRouter.post('/schools/:id/contracts', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try { res.status(201).json(await addRenewal(req.user!, idParam.parse(req.params).id, renewalBody.parse(req.body) as never, ctx(req))) } catch (e) { next(e) }
})

import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { requestLog } from './middleware/request-log.js'
import { originCheck } from './middleware/auth.js'
import { authRouter } from './routes/auth.routes.js'
import { auditRouter } from './routes/audit.routes.js'
import { masterRouter } from './routes/master.routes.js'
import { usersRouter } from './routes/users.routes.js'
import { schoolRouter } from './routes/school.routes.js'
import { assignmentRouter } from './routes/assignment.routes.js'
import { visitRouter } from './routes/visit.routes.js'
import { dashboardRouter } from './routes/dashboard.routes.js'
import { csvRouter } from './routes/csv.routes.js'
import { healthRouter } from './routes/health.routes.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
    if (config.secureCookie) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    next()
  })
  app.use(requestLog)
  app.use(cors({ origin: config.corsOrigin, credentials: true }))
  app.use('/api/import', express.json({ limit: '6mb' }))
  app.use(express.json())
  app.set('trust proxy', 1)
  app.use('/api', originCheck)
  app.use('/api', authRouter)
  app.use('/api', usersRouter)
  app.use('/api', masterRouter)
  app.use('/api', auditRouter)
  app.use('/api', schoolRouter)
  app.use('/api', assignmentRouter)
  app.use('/api', visitRouter)
  app.use('/api', dashboardRouter)
  app.use('/api', csvRouter)
  app.use('/api/health', healthRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

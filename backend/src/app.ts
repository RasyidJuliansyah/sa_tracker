import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { requestLog } from './middleware/request-log.js'
import { originCheck } from './middleware/auth.js'
import { authRouter } from './routes/auth.routes.js'
import { healthRouter } from './routes/health.routes.js'

export function createApp() {
  const app = express()
  app.use(requestLog)
  app.use(cors({ origin: config.corsOrigin, credentials: true }))
  app.use(express.json())
  app.set('trust proxy', 1)
  app.use('/api', originCheck)
  app.use('/api', authRouter)
  app.use('/api/health', healthRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

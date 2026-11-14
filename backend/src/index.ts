import { createApp } from './app.js'
import { config } from './config.js'
import { log } from './utils/logger.js'

createApp().listen(config.port, () => {
  log('info', 'server started', { port: config.port })
})

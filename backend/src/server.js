'use strict'

const config = require('./config')
const app = require('./app')
const { runMigrations } = require('./db/migrate')
const fs = require('fs')
const path = require('path')

// Ensure uploads directory exists
const uploadsDir = config.UPLOADS_PATH
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Ensure data directory for SQLite exists
const dataDir = path.dirname(config.DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Run database migrations before accepting traffic
runMigrations()

// Start the server
app.listen(config.PORT, () => {
  console.log(`[server] InnovatEPAM Portal API running on http://localhost:${config.PORT}`)
  console.log(`[server] Environment: ${config.NODE_ENV}`)
})

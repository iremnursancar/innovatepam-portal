'use strict'

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const config = require('./config')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true, // allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ── Body / Cookie parsing ─────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ── Static file serving (uploaded attachments) ───────────────────────────────
app.use('/uploads', express.static(config.UPLOADS_PATH))

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// ── Route mounting ────────────────────────────────────────────────────────────
const authRoutes          = require('./routes/auth')
const ideasRoutes         = require('./routes/ideas')
const evaluationsRoutes   = require('./routes/evaluations')
const attachmentsRoutes   = require('./routes/attachments')
const activitiesRoutes    = require('./routes/activities')
const statsRoutes         = require('./routes/stats')
const notificationsRoutes = require('./routes/notifications')

app.use('/api/auth',          authRoutes)
app.use('/api/ideas',         ideasRoutes)
app.use('/api/evaluations',   evaluationsRoutes)
app.use('/api/attachments',   attachmentsRoutes)
app.use('/api/activities',    activitiesRoutes)
app.use('/api/stats',         statsRoutes)
app.use('/api/notifications', notificationsRoutes)

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' })
})

// ── Global error handler (MUST be last) ──────────────────────────────────────
app.use(errorHandler)

module.exports = app

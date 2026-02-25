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
const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)
// Ideas routes → T030
// Evaluations routes → T043

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' })
})

// ── Global error handler (MUST be last) ──────────────────────────────────────
app.use(errorHandler)

module.exports = app

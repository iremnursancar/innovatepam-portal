'use strict'

require('dotenv').config()

const REQUIRED_VARS = ['JWT_SECRET']

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

const path = require('path')

const config = {
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET,
  DB_PATH: process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, '../../data/db.sqlite'),
  UPLOADS_PATH: process.env.UPLOADS_PATH
    ? path.resolve(process.env.UPLOADS_PATH)
    : path.join(__dirname, '../../uploads'),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
}

module.exports = config

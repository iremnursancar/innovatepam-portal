'use strict'
/**
 * Runs before the test framework is installed (Jest `setupFiles`).
 * Overrides common environment variables used by every test file.
 * DB_PATH is intentionally omitted here — each test file sets its own
 * unique path (before requiring any app module) to avoid cross-file
 * SQLite file-locking with node-sqlite3-wasm.
 */
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_chars!!'
process.env.CORS_ORIGIN = 'http://localhost:5173'
process.env.UPLOADS_PATH = require('path').join(__dirname, '../../../uploads')
process.env.PORT = '3001'

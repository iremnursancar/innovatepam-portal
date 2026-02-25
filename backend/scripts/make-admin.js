'use strict'

const { Database } = require('node-sqlite3-wasm')
const path = require('path')

const DB_PATH = path.resolve(__dirname, '../data/innovatepam.db')
const TARGET_EMAIL = 'admin@innovatepam.com'

const db = new Database(DB_PATH)

try {
  db.exec('PRAGMA foreign_keys = ON')

  const stmt = db.prepare('UPDATE users SET role = ? WHERE email = ?')
  stmt.run(['admin', TARGET_EMAIL])
  stmt.finalize()

  // Verify the update
  const row = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get([TARGET_EMAIL])

  if (row) {
    console.log(`Success: user '${row.email}' (id=${row.id}) now has role '${row.role}'.`)
  } else {
    console.warn(`Warning: no user found with email '${TARGET_EMAIL}'. No rows were updated.`)
  }
} finally {
  try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)') } catch { /* ignore */ }
  db.close()
}

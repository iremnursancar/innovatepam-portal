'use strict'

const fs = require('fs')
const path = require('path')
const { getDb } = require('./database')

const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

/**
 * Runs all pending SQL migration files in order.
 * Migration files must follow the pattern: NNN_description.sql
 */
function runMigrations() {
  const db = getDb()

  // Ensure the migrations tracker table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all([]).map(r => r.version)
  )

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{3}_.*\.sql$/.test(f))
    .sort()

  for (const file of files) {
    const version = parseInt(file.slice(0, 3), 10)
    if (applied.has(version)) continue

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
    db.exec(sql)
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run([version])
    console.log(`[migrate] Applied migration: ${file}`)
  }

  console.log('[migrate] Database schema is up to date.')
}

module.exports = { runMigrations }

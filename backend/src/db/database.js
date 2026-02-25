'use strict'

const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')
const config = require('../config')

let db

/**
 * Returns the shared SQLite database connection.
 * Initialises it with WAL mode on first call.
 * Uses the built-in node:sqlite module (Node.js 22.5+, stable in Node.js 24).
 * @returns {DatabaseSync}
 */
function getDb() {
  if (!db) {
    // Ensure directory exists for the DB file
    const dir = path.dirname(config.DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new DatabaseSync(config.DB_PATH)
    // WAL mode improves concurrent reads; node:sqlite handles this reliably.
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')
  }
  return db
}

/**
 * Closes the database connection. Useful in tests.
 */
function closeDb() {
  if (db) {
    // Checkpoint WAL before closing so the file is clean for the next open
    try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)') } catch { /* ignore */ }
    try { db.close() } catch { /* ignore */ }
    db = null
  }
}

module.exports = { getDb, closeDb }

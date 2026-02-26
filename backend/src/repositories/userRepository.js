'use strict'

const { getDb } = require('../db/database')

/**
 * Finds a user by their email address.
 * @param {string} email
 * @returns {{ id, email, password, role, created_at } | undefined}
 */
function findByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email)
}

/**
 * Finds a user by their primary key.
 * @param {number} id
 * @returns {{ id, email, role, created_at } | undefined}
 */
function findById(id) {
  return getDb()
    .prepare('SELECT id, email, role, created_at FROM users WHERE id = ?')
    .get(id)
}

/**
 * Creates a new user record.
 * @param {{ email: string, password: string, role?: string }} data
 * @returns {{ id: number, email: string, role: string, created_at: string }}
 */
function createUser({ email, password, role = 'submitter' }) {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO users (email, password, role) VALUES (?, ?, ?)'
  )
  const result = stmt.run(email, password, role)
  return findById(result.lastInsertRowid)
}

/**
 * Updates the role of a user identified by email.
 * @param {string} email
 * @param {string} role
 * @returns {{ id: number, email: string, role: string, created_at: string } | undefined}
 */
function updateUserRole(email, role) {
  const db = getDb()
  db.prepare('UPDATE users SET role = ? WHERE email = ?').run(role, email)
  return findByEmail(email)
}

/**
 * Returns all users with the given role.
 * @param {string} role
 * @returns {Array<{ id: number, email: string, role: string, created_at: string }>}
 */
function findByRole(role) {
  return getDb()
    .prepare('SELECT id, email, role, created_at FROM users WHERE role = ?')
    .all(role)
}

module.exports = { findByEmail, findById, createUser, updateUserRole, findByRole }

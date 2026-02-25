'use strict'

const { getDb } = require('../db/database')

/**
 * Valid category values (mirrors DB CHECK constraint).
 */
const VALID_CATEGORIES = [
  'process_improvement',
  'product_idea',
  'cost_reduction',
  'customer_experience',
  'other',
]

/**
 * Valid status transitions recognised by the API.
 */
const VALID_STATUSES = ['submitted', 'under_review', 'accepted', 'rejected']

// ── Queries ──────────────────────────────────────────────────────────────────

const SQL = {
  findById: `
    SELECT i.*, u.email AS submitter_email
    FROM   ideas i
    JOIN   users u ON u.id = i.submitter_id
    WHERE  i.id = ?`,

  findBySubmitter: `
    SELECT i.*, u.email AS submitter_email
    FROM   ideas i
    JOIN   users u ON u.id = i.submitter_id
    WHERE  i.submitter_id = ?
    ORDER  BY i.created_at DESC`,

  findAll: `
    SELECT i.*, u.email AS submitter_email
    FROM   ideas i
    JOIN   users u ON u.id = i.submitter_id
    ORDER  BY i.created_at DESC`,

  create: `
    INSERT INTO ideas (title, description, category, submitter_id)
    VALUES (?, ?, ?, ?)`,

  updateStatus: `
    UPDATE ideas
    SET    status = ?, updated_at = datetime('now')
    WHERE  id = ?`,
}

// ── Repository ────────────────────────────────────────────────────────────────

/**
 * @param {number} id
 */
function findById(id) {
  return getDb().prepare(SQL.findById).get(id)
}

/**
 * @param {number} submitterId
 */
function findBySubmitter(submitterId) {
  return getDb().prepare(SQL.findBySubmitter).all(submitterId)
}

/**
 * Returns every idea (admin view).
 */
function findAll() {
  return getDb().prepare(SQL.findAll).all()
}

/**
 * @param {{ title, description, category, submitterId }} data
 * @returns newly created idea row
 */
function createIdea({ title, description, category, submitterId }) {
  const db = getDb()
  const result = db.prepare(SQL.create).run(title, description, category, submitterId)
  return findById(result.lastInsertRowid)
}

/**
 * @param {number} id
 * @param {string} status  one of VALID_STATUSES
 */
function updateStatus(id, status) {
  getDb().prepare(SQL.updateStatus).run(status, id)
  return findById(id)
}

module.exports = {
  VALID_CATEGORIES,
  VALID_STATUSES,
  findById,
  findBySubmitter,
  findAll,
  createIdea,
  updateStatus,
}

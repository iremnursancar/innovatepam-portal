'use strict'

const { getDb } = require('../db/database')

const SQL = {
  upsert: `
    INSERT INTO evaluations (idea_id, admin_id, decision, comment)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(idea_id) DO UPDATE SET
      admin_id   = excluded.admin_id,
      decision   = excluded.decision,
      comment    = excluded.comment,
      updated_at = datetime('now')`,

  findByIdeaId: `
    SELECT e.*, u.email AS admin_email
    FROM   evaluations e
    JOIN   users u ON u.id = e.admin_id
    WHERE  e.idea_id = ?`,
}

/**
 * Insert or replace an evaluation for the given idea.
 * @param {{ ideaId, adminId, decision, comment }} data
 */
function upsertEvaluation({ ideaId, adminId, decision, comment }) {
  getDb().prepare(SQL.upsert).run(ideaId, adminId, decision, comment)
  return findByIdeaId(ideaId)
}

/**
 * @param {number} ideaId
 */
function findByIdeaId(ideaId) {
  return getDb().prepare(SQL.findByIdeaId).get(ideaId)
}

module.exports = { upsertEvaluation, findByIdeaId }

'use strict'

const { getDb } = require('../db/database')

const SQL = {
  insert: `
    INSERT INTO idea_status_history (idea_id, status, changed_by)
    VALUES (?, ?, ?)`,

  findByIdeaId: `
    SELECT id, idea_id, status, changed_by, timestamp
    FROM   idea_status_history
    WHERE  idea_id = ?
    ORDER  BY timestamp ASC`,
}

/**
 * Records a status transition.
 * @param {{ ideaId: number, status: string, changedBy: string }} params
 */
function recordStatusChange({ ideaId, status, changedBy }) {
  getDb().prepare(SQL.insert).run(ideaId, status, changedBy)
}

/**
 * Returns the full ordered history for an idea.
 * @param {number} ideaId
 * @returns {Array<{ id, idea_id, status, changed_by, timestamp }>}
 */
function findByIdeaId(ideaId) {
  return getDb().prepare(SQL.findByIdeaId).all(ideaId)
}

module.exports = { recordStatusChange, findByIdeaId }

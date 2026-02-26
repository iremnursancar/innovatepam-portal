'use strict'

const { getDb } = require('../db/database')

const SQL = {
  // Admin: ideas awaiting action (submitted or under_review)
  pendingIdeas: `
    SELECT COUNT(*) AS count
    FROM   ideas
    WHERE  status IN ('submitted', 'under_review')`,

  // Submitter: their ideas that have received a decision (accepted or rejected)
  decidedIdeas: `
    SELECT COUNT(*) AS count
    FROM   ideas
    WHERE  submitter_id = ?
    AND    status IN ('accepted', 'rejected')`,
}

/**
 * Returns the count of ideas pending admin action.
 * @returns {number}
 */
function countPendingIdeas() {
  return getDb().prepare(SQL.pendingIdeas).get().count
}

/**
 * Returns the count of a submitter's ideas that have been decided.
 * Used as the "new activity" indicator for regular users.
 * @param {number} submitterId
 * @returns {number}
 */
function countDecidedIdeasForSubmitter(submitterId) {
  return getDb().prepare(SQL.decidedIdeas).get(submitterId).count
}

module.exports = { countPendingIdeas, countDecidedIdeasForSubmitter }

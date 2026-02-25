'use strict'

const { getDb } = require('../db/database')

const SQL = {
  insert: `
    INSERT INTO activities (type, user_email, idea_title)
    VALUES (?, ?, ?)`,

  getRecent: `
    SELECT id, type, user_email, idea_title, timestamp
    FROM   activities
    ORDER  BY timestamp DESC
    LIMIT  ?`,
}

/**
 * Records a new activity event.
 * @param {{ type: string, user_email: string, idea_title: string }} data
 */
function recordActivity({ type, user_email, idea_title }) {
  getDb().prepare(SQL.insert).run(type, user_email, idea_title)
}

/**
 * Returns the most recent activity events.
 * @param {number} [limit=20]
 * @returns {Array<{ id, type, user_email, idea_title, timestamp }>}
 */
function getRecent(limit = 20) {
  return getDb().prepare(SQL.getRecent).all(limit)
}

module.exports = { recordActivity, getRecent }

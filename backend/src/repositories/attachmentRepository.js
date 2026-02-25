'use strict'

const { getDb } = require('../db/database')

const SQL = {
  create: `
    INSERT INTO attachments (idea_id, filename, originalname, mimetype, size)
    VALUES (?, ?, ?, ?, ?)`,

  findByIdeaId: `
    SELECT * FROM attachments WHERE idea_id = ? ORDER BY created_at DESC`,

  findById: `
    SELECT * FROM attachments WHERE id = ?`,
}

/**
 * @param {{ ideaId, filename, originalname, mimetype, size }} data
 */
function createAttachment({ ideaId, filename, originalname, mimetype, size }) {
  const db = getDb()
  const result = db.prepare(SQL.create).run(ideaId, filename, originalname, mimetype, size)
  return findById(result.lastInsertRowid)
}

/**
 * @param {number} ideaId
 */
function findByIdeaId(ideaId) {
  return getDb().prepare(SQL.findByIdeaId).all(ideaId)
}

/**
 * @param {number} id
 */
function findById(id) {
  return getDb().prepare(SQL.findById).get(id)
}

module.exports = { createAttachment, findByIdeaId, findById }

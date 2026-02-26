'use strict'

const { getDb } = require('../db/database')

const SQL = {
  create: `
    INSERT INTO notifications (user_id, idea_id, type, message)
    VALUES (?, ?, ?, ?)`,

  findByUser: `
    SELECT id, user_id, idea_id, type, message, is_read, created_at
    FROM   notifications
    WHERE  user_id = ?
    ORDER  BY created_at DESC
    LIMIT  50`,

  findUnreadCount: `
    SELECT COUNT(*) AS count
    FROM   notifications
    WHERE  user_id = ? AND is_read = 0`,

  markAsRead: `
    UPDATE notifications
    SET    is_read = 1
    WHERE  id = ?`,

  markAllAsRead: `
    UPDATE notifications
    SET    is_read = 1
    WHERE  user_id = ? AND is_read = 0`,
}

/**
 * Creates a new notification for a user.
 * @param {number} userId
 * @param {number} ideaId
 * @param {string} type  'under_review' | 'accepted' | 'rejected'
 * @param {string} message
 */
function createNotification(userId, ideaId, type, message) {
  getDb().prepare(SQL.create).run(userId, ideaId, type, message)
}

/**
 * Returns the 50 most recent notifications for a user (read + unread).
 * @param {number} userId
 * @returns {Array}
 */
function findByUser(userId) {
  return getDb().prepare(SQL.findByUser).all(userId)
}

/**
 * Returns the number of unread notifications for a user.
 * @param {number} userId
 * @returns {number}
 */
function countUnread(userId) {
  return getDb().prepare(SQL.findUnreadCount).get(userId).count
}

/**
 * Marks a single notification as read.
 * @param {number} notificationId
 */
function markAsRead(notificationId) {
  getDb().prepare(SQL.markAsRead).run(notificationId)
}

/**
 * Marks all of a user's notifications as read.
 * @param {number} userId
 */
function markAllAsRead(userId) {
  getDb().prepare(SQL.markAllAsRead).run(userId)
}

module.exports = { createNotification, findByUser, countUnread, markAsRead, markAllAsRead }

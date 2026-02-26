'use strict'

const { Router } = require('express')
const authenticate = require('../middleware/authenticate')
const { countPendingIdeas, countDecidedIdeasForSubmitter } = require('../repositories/notificationsRepository')
const {
  findByUser,
  countUnread,
  markAsRead,
  markAllAsRead,
} = require('../repositories/notificationRepository')

const router = Router()

router.use(authenticate)

/**
 * GET /api/notifications/count
 * Returns pending notification counts appropriate to the requesting user's role.
 */
router.get('/count', (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({
        pendingIdeas: countPendingIdeas(),
        newActivities: 0,
      })
    }
    return res.json({
      pendingIdeas: 0,
      newActivities: countDecidedIdeasForSubmitter(req.user.id),
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/notifications
 * Returns the current user's notifications (newest first, max 50).
 */
router.get('/', (req, res, next) => {
  try {
    const notifications = findByUser(req.user.id)
    const unreadCount   = countUnread(req.user.id)
    return res.json({ notifications, unreadCount })
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/notifications/read-all
 * Marks all of the current user's notifications as read.
 * Must be defined BEFORE the /:id route to avoid param collision.
 */
router.patch('/read-all', (req, res, next) => {
  try {
    markAllAsRead(req.user.id)
    return res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 */
router.patch('/:id/read', (req, res, next) => {
  try {
    markAsRead(Number(req.params.id))
    return res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router

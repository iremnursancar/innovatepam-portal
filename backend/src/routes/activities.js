'use strict'

const { Router } = require('express')
const authenticate = require('../middleware/authenticate')
const { getRecent } = require('../repositories/activityRepository')

const router = Router()

// Require login to read the activity feed
router.use(authenticate)

/**
 * GET /api/activities
 * Returns the 20 most recent activity events, newest first.
 */
router.get('/', (req, res, next) => {
  try {
    const activities = getRecent(20)
    return res.json({ activities })
  } catch (err) {
    next(err)
  }
})

module.exports = router

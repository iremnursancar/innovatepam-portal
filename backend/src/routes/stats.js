'use strict'

const { Router } = require('express')
const authenticate  = require('../middleware/authenticate')
const requireRole   = require('../middleware/requireRole')
const { getStats }  = require('../repositories/statsRepository')

const router = Router()

// Admin-only
router.use(authenticate, requireRole('admin'))

/**
 * GET /api/stats
 * Returns aggregated idea statistics.
 */
router.get('/', (req, res, next) => {
  try {
    const stats = getStats()
    return res.json({ stats })
  } catch (err) {
    next(err)
  }
})

module.exports = router

'use strict'

const { Router } = require('express')
const authenticate = require('../middleware/authenticate')
const requireRole = require('../middleware/requireRole')
const { evaluate } = require('../services/evaluationService')

const router = Router()

// All evaluation routes require admin access
router.use(authenticate, requireRole('admin'))

/**
 * POST /api/evaluations
 * Body: { ideaId, decision: 'accepted'|'rejected', comment }
 */
router.post('/', (req, res, next) => {
  try {
    const { ideaId, decision, comment } = req.body

    if (!ideaId) {
      return res.status(400).json({ error: "Field 'ideaId' is required." })
    }

    const result = evaluate(parseInt(ideaId, 10), req.user, decision, comment)
    return res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

module.exports = router

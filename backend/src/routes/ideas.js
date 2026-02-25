'use strict'

const { Router } = require('express')
const authenticate = require('../middleware/authenticate')
const upload = require('../middleware/upload')
const { submitIdea, listIdeas, getIdeaDetail, markUnderReview } = require('../services/ideaService')

const router = Router()

// All idea routes require authentication
router.use(authenticate)

/**
 * POST /api/ideas
 * Submit a new idea (any authenticated user).
 * Accepts multipart/form-data with optional file field "attachment".
 */
router.post('/', upload.single('attachment'), async (req, res, next) => {
  try {
    const { title, description, category } = req.body
    const result = await submitIdea(req.user.id, { title, description, category }, req.file)
    return res.status(201).json({ idea: result })
  } catch (err) {
    // Clean up uploaded file on validation error
    if (req.file) {
      const fs = require('fs')
      fs.unlink(req.file.path, () => {})
    }
    next(err)
  }
})

/**
 * GET /api/ideas
 * List ideas — role-filtered (submitters see own, admins see all).
 */
router.get('/', (req, res, next) => {
  try {
    const ideas = listIdeas(req.user)
    return res.json({ ideas })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/ideas/:id
 * Get single idea with attachment list and evaluation (if any).
 */
router.get('/:id', (req, res, next) => {
  try {
    const idea = getIdeaDetail(parseInt(req.params.id, 10), req.user)
    return res.json({ idea })
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/ideas/:id/status
 * Admin-only: move idea to "under_review".
 */
router.patch('/:id/status', (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' })
    }
    const idea = markUnderReview(parseInt(req.params.id, 10))
    return res.json({ idea })
  } catch (err) {
    next(err)
  }
})

module.exports = router

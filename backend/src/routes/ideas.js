'use strict'

const { Router } = require('express')
const authenticate = require('../middleware/authenticate')
const upload = require('../middleware/upload')
const { submitIdea, listIdeas, getIdeaDetail, markUnderReview, analyzeIdea } = require('../services/ideaService')
const { toggleVote, getVoteInfo, enrichWithVotes } = require('../repositories/voteRepository')
const { findAll } = require('../repositories/ideaRepository')

const router = Router()

// All idea routes require authentication
router.use(authenticate)

/**
 * POST /api/ideas/analyze
 * Keyword-based analysis — returns suggested category, impact score,
 * similar-idea count, and writing tips. No auth required? We still
 * gate it behind authenticate so anonymous users can't probe the DB.
 */
router.post('/analyze', (req, res, next) => {
  try {
    const { title = '', description = '' } = req.body
    if (!title.trim() && !description.trim()) {
      return res.status(400).json({ error: 'title or description is required.' })
    }
    const result = analyzeIdea({ title, description })
    return res.json(result)
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/ideas
 * Submit a new idea (any authenticated user).
 * Accepts multipart/form-data with optional file field "attachment".
 */
router.post('/', upload.single('attachment'), async (req, res, next) => {
  try {
    const { title, description, category, is_public } = req.body
    const isPublic = is_public === 'true' || is_public === true || is_public === 1
    const result = await submitIdea(req.user.id, { title, description, category, isPublic }, req.file)
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
 * GET /api/ideas/export
 * Admin-only: stream all ideas as a downloadable CSV file.
 */
router.get('/export', (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' })
    }

    const ideas = enrichWithVotes(findAll(), req.user.id)

    const HEADERS = ['ID', 'Title', 'Category', 'Status', 'Submitter Email', 'Vote Count', 'Is Public', 'Created Date']

    function escapeCsv(value) {
      const str = value == null ? '' : String(value)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }

    const rows = ideas.map(idea => [
      idea.id,
      idea.title,
      idea.category,
      idea.status,
      idea.submitter_email ?? '',
      idea.voteCount ?? 0,
      idea.is_public ? 'Yes' : 'No',
      idea.created_at ? new Date(idea.created_at).toISOString().split('T')[0] : '',
    ].map(escapeCsv).join(','))

    const csv = [HEADERS.join(','), ...rows].join('\r\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="ideas-export.csv"')
    return res.send(csv)
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/ideas/:id/vote
 * Toggle vote for the authenticated user on the given idea.
 */
router.post('/:id/vote', (req, res, next) => {
  try {
    const ideaId = parseInt(req.params.id, 10)
    const result = toggleVote(ideaId, req.user.id)
    return res.json(result)
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/ideas/:id/votes
 * Returns { voteCount, hasVoted } for the current user.
 */
router.get('/:id/votes', (req, res, next) => {
  try {
    const ideaId = parseInt(req.params.id, 10)
    const result = getVoteInfo(ideaId, req.user.id)
    return res.json(result)
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
    const idea = markUnderReview(parseInt(req.params.id, 10), req.user)
    return res.json({ idea })
  } catch (err) {
    next(err)
  }
})

module.exports = router

'use strict'

const { Router } = require('express')
const path = require('path')
const fs = require('fs')
const authenticate = require('../middleware/authenticate')
const { findById } = require('../repositories/attachmentRepository')
const { getIdeaDetail } = require('../services/ideaService')
const config = require('../config')

const router = Router()

router.use(authenticate)

/**
 * GET /api/attachments/:id/download
 * Streams the attachment file with the correct Content-Disposition header.
 * Respects the same access rules as the parent idea.
 */
router.get('/:id/download', (req, res, next) => {
  try {
    const attachment = findById(parseInt(req.params.id, 10))
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found.' })
    }

    // Verify the requesting user can access the parent idea
    getIdeaDetail(attachment.idea_id, req.user)

    const filePath = path.join(config.UPLOADS_PATH, attachment.filename)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server.' })
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalname}"`)
    res.setHeader('Content-Type', attachment.mimetype)
    return res.sendFile(filePath)
  } catch (err) {
    next(err)
  }
})

module.exports = router

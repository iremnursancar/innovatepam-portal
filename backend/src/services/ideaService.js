'use strict'

const {
  VALID_CATEGORIES,
  createIdea,
  findById,
  findBySubmitter,
  findAll,
  updateStatus,
} = require('../repositories/ideaRepository')
const { createAttachment, findByIdeaId: findAttachments } = require('../repositories/attachmentRepository')
const { findByIdeaId: findEvaluation } = require('../repositories/evaluationRepository')

/**
 * Submits a new idea, optionally with a file attachment.
 *
 * @param {number} submitterId
 * @param {{ title, description, category }} fields
 * @param {Express.Multer.File|undefined} file
 * @returns {object} idea with attachment array
 */
async function submitIdea(submitterId, { title, description, category }, file) {
  // Validate required fields
  if (!title || !title.trim()) {
    throw Object.assign(new Error('Title is required.'), { status: 400 })
  }
  if (!description || !description.trim()) {
    throw Object.assign(new Error('Description is required.'), { status: 400 })
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    throw Object.assign(
      new Error(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`),
      { status: 400 }
    )
  }

  const idea = createIdea({
    title: title.trim(),
    description: description.trim(),
    category,
    submitterId,
  })

  let attachment = null
  if (file) {
    attachment = createAttachment({
      ideaId: idea.id,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    })
  }

  return { ...idea, attachments: attachment ? [attachment] : [] }
}

/**
 * Returns ideas visible to the requesting user:
 *  - admin  → all ideas
 *  - submitter → own ideas only
 */
function listIdeas(requestingUser) {
  const rows = requestingUser.role === 'admin' ? findAll() : findBySubmitter(requestingUser.id)
  return rows
}

/**
 * Returns a single idea with its attachment list and evaluation (if any).
 * Submitters may only access their own ideas.
 *
 * @param {number} ideaId
 * @param {{ id, role }} requestingUser
 */
function getIdeaDetail(ideaId, requestingUser) {
  const idea = findById(ideaId)
  if (!idea) {
    throw Object.assign(new Error('Idea not found.'), { status: 404 })
  }
  if (requestingUser.role !== 'admin' && idea.submitter_id !== requestingUser.id) {
    throw Object.assign(new Error('You do not have permission to view this idea.'), { status: 403 })
  }

  const attachments = findAttachments(ideaId)
  const evaluation = findEvaluation(ideaId)

  return { ...idea, attachments, evaluation: evaluation ?? null }
}

/**
 * Sets an idea to "under_review" status (admin only check done in route).
 *
 * @param {number} ideaId
 */
function markUnderReview(ideaId) {
  const idea = findById(ideaId)
  if (!idea) {
    throw Object.assign(new Error('Idea not found.'), { status: 404 })
  }
  return updateStatus(ideaId, 'under_review')
}

module.exports = { submitIdea, listIdeas, getIdeaDetail, markUnderReview }

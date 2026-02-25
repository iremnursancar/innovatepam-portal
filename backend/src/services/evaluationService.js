'use strict'

const { upsertEvaluation } = require('../repositories/evaluationRepository')
const { findById: findIdeaById, updateStatus } = require('../repositories/ideaRepository')

const VALID_DECISIONS = ['accepted', 'rejected']

/**
 * Records (or updates) an evaluation for an idea.
 * Updates the idea status to match the decision.
 *
 * @param {number} ideaId
 * @param {{ id: number, role: string }} admin
 * @param {string} decision  'accepted' | 'rejected'
 * @param {string} comment   mandatory non-empty string
 * @returns {{ idea, evaluation }}
 */
function evaluate(ideaId, admin, decision, comment) {
  if (!VALID_DECISIONS.includes(decision)) {
    throw Object.assign(
      new Error(`Decision must be one of: ${VALID_DECISIONS.join(', ')}.`),
      { status: 400 }
    )
  }
  if (!comment || !comment.trim()) {
    throw Object.assign(new Error('A comment is required for every evaluation.'), { status: 400 })
  }

  const idea = findIdeaById(ideaId)
  if (!idea) {
    throw Object.assign(new Error('Idea not found.'), { status: 404 })
  }

  // Upsert the evaluation record
  const evaluation = upsertEvaluation({
    ideaId,
    adminId: admin.id,
    decision,
    comment: comment.trim(),
  })

  // Sync idea status
  const updatedIdea = updateStatus(ideaId, decision)

  return { idea: updatedIdea, evaluation }
}

module.exports = { evaluate, VALID_DECISIONS }

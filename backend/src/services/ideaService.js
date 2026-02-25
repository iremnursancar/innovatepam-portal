'use strict'

const {
  VALID_CATEGORIES,
  createIdea,
  findById,
  findBySubmitter,
  findVisibleToSubmitter,
  findAll,
  updateStatus,
} = require('../repositories/ideaRepository')
const { createAttachment, findByIdeaId: findAttachments } = require('../repositories/attachmentRepository')
const { findByIdeaId: findEvaluation } = require('../repositories/evaluationRepository')
const { recordActivity } = require('../repositories/activityRepository')
const { recordStatusChange, findByIdeaId: findHistory } = require('../repositories/statusHistoryRepository')
const { enrichWithVotes, getVoteInfo } = require('../repositories/voteRepository')

/**
 * Submits a new idea, optionally with a file attachment.
 *
 * @param {number} submitterId
 * @param {{ title, description, category }} fields
 * @param {Express.Multer.File|undefined} file
 * @returns {object} idea with attachment array
 */
async function submitIdea(submitterId, { title, description, category, isPublic = false }, file) {
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
    isPublic,
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

  try {
    recordActivity({ type: 'idea_submitted', user_email: idea.submitter_email, idea_title: idea.title })
  } catch { /* non-critical */ }

  try {
    recordStatusChange({ ideaId: idea.id, status: 'submitted', changedBy: idea.submitter_email })
  } catch { /* non-critical */ }

  return { ...idea, attachments: attachment ? [attachment] : [] }
}

/**
 * Returns ideas visible to the requesting user:
 *  - admin      → all ideas
 *  - submitter  → own ideas + all public ideas from others
 */
function listIdeas(requestingUser) {
  const rows = requestingUser.role === 'admin'
    ? findAll()
    : findVisibleToSubmitter(requestingUser.id)
  return enrichWithVotes(rows, requestingUser.id)
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
  // Access is allowed if: admin, or own idea, or idea is public
  if (
    requestingUser.role !== 'admin' &&
    idea.submitter_id !== requestingUser.id &&
    !idea.is_public
  ) {
    throw Object.assign(new Error('You do not have permission to view this idea.'), { status: 403 })
  }

  const attachments = findAttachments(ideaId)
  const evaluation  = findEvaluation(ideaId)
  const history     = findHistory(ideaId)
  const { voteCount, hasVoted } = getVoteInfo(ideaId, requestingUser.id)

  return { ...idea, attachments, evaluation: evaluation ?? null, statusHistory: history, voteCount, hasVoted }
}

/**
 * Sets an idea to "under_review" status (admin only check done in route).
 *
 * @param {number} ideaId
 * @param {{ email: string }} admin - the admin performing the action
 */
function markUnderReview(ideaId, admin) {
  const idea = findById(ideaId)
  if (!idea) {
    throw Object.assign(new Error('Idea not found.'), { status: 404 })
  }
  const updated = updateStatus(ideaId, 'under_review')
  try {
    recordActivity({ type: 'idea_under_review', user_email: admin?.email ?? 'admin', idea_title: idea.title })
  } catch { /* non-critical */ }
  try {
    recordStatusChange({ ideaId, status: 'under_review', changedBy: admin?.email ?? 'admin' })
  } catch { /* non-critical */ }
  return updated
}

// ── Keyword tables ─────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  process_improvement:  ['process', 'workflow', 'efficiency', 'automation', 'automate',
                         'streamline', 'optimize', 'procedure', 'bottleneck', 'manual', 'redundant'],
  product_idea:         ['product', 'feature', 'app', 'software', 'tool', 'platform',
                         'service', 'interface', 'dashboard', 'design', 'ui', 'ux'],
  cost_reduction:       ['cost', 'save', 'saving', 'reduce', 'budget', 'expense',
                         'cheaper', 'money', 'waste', 'eliminate', 'cut', 'spend'],
  customer_experience:  ['customer', 'client', 'satisfaction', 'support', 'experience',
                         'engagement', 'feedback', 'onboarding', 'response', 'user'],
}

const HIGH_IMPACT_WORDS   = ['entire', 'all', 'company', 'everyone', 'critical',
                              'significant', 'major', 'revenue', 'global', 'strategic']
const MEDIUM_IMPACT_WORDS = ['team', 'department', 'improve', 'increase',
                              'better', 'multiple', 'many', 'several']

/**
 * Keyword-based idea analysis (no LLM needed).
 *
 * @param {{ title: string, description: string }} idea
 * @returns {{ similarIdeasCount, suggestedCategory, impactScore, tips }}
 */
function analyzeIdea({ title, description }) {
  const combined = `${title} ${description}`.toLowerCase()
  const words    = combined.split(/\W+/).filter(Boolean)

  // --- Suggested category ---
  let bestCategory = 'other'
  let bestScore    = 0
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = kws.filter(k => words.includes(k)).length
    if (score > bestScore) { bestScore = score; bestCategory = cat }
  }

  // --- Impact score ---
  const highHits   = HIGH_IMPACT_WORDS.filter(w => combined.includes(w)).length
  const mediumHits = MEDIUM_IMPACT_WORDS.filter(w => combined.includes(w)).length
  let impactScore = 'Low'
  if (highHits >= 2 || (highHits >= 1 && mediumHits >= 2)) impactScore = 'High'
  else if (highHits >= 1 || mediumHits >= 2)              impactScore = 'Medium'
  else if (mediumHits >= 1)                               impactScore = 'Medium'

  // --- Similar ideas count ---
  const queryWords = [...new Set(
    `${title} ${description}`.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  )]
  const allIdeas   = findAll()
  const similarIdeasCount = allIdeas.filter(idea => {
    const ideaText = `${idea.title} ${idea.description}`.toLowerCase()
    return queryWords.some(w => ideaText.includes(w))
  }).length

  // --- Tips ---
  const tips = []
  if (title.trim().length < 20)
    tips.push('Add more detail to your title to make it descriptive and searchable.')
  if (description.trim().length < 100)
    tips.push('Expand your description — include the problem, proposed solution, and expected benefits.')
  if (!/benefit|improve|save|result|impact/i.test(description))
    tips.push('Mention the expected outcome or benefit to strengthen your proposal.')
  if (tips.length < 2)
    tips.push('Consider adding a supporting attachment (data, diagrams, or examples) to back your idea.')

  return {
    similarIdeasCount,
    suggestedCategory: bestCategory,
    impactScore,
    tips: tips.slice(0, 3),
  }
}

module.exports = { submitIdea, listIdeas, getIdeaDetail, markUnderReview, analyzeIdea }

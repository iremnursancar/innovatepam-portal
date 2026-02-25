import axios from 'axios'

const BASE = '/api/ideas'

/**
 * Submit a new idea (with optional file).
 * @param {{ title: string, description: string, category: string, attachment?: File }} data
 */
export async function submitIdea(data) {
  const form = new FormData()
  form.append('title', data.title)
  form.append('description', data.description)
  form.append('category', data.category)
  form.append('is_public', data.isPublic ? 'true' : 'false')
  if (data.attachment) {
    form.append('attachment', data.attachment)
  }
  const res = await axios.post(BASE, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  })
  return res.data.idea
}

/**
 * Keyword-based idea analysis.
 * @param {{ title: string, description: string }} data
 * @returns {{ similarIdeasCount, suggestedCategory, impactScore, tips }}
 */
export async function analyzeIdea({ title, description }) {
  const res = await axios.post(
    `${BASE}/analyze`,
    { title, description },
    { withCredentials: true },
  )
  return res.data
}

/**
 * List ideas (submitter: own; admin: all).
 */
export async function listIdeas() {
  const res = await axios.get(BASE, { withCredentials: true })
  return res.data.ideas
}

/**
 * Get a single idea with attachments and evaluation.
 * @param {number|string} id
 */
export async function getIdea(id) {
  const res = await axios.get(`${BASE}/${id}`, { withCredentials: true })
  return res.data.idea
}

/**
 * Admin: move idea to under_review.
 * @param {number|string} id
 */
export async function setUnderReview(id) {
  const res = await axios.patch(`${BASE}/${id}/status`, {}, { withCredentials: true })
  return res.data.idea
}

/**
 * Toggle vote for the current user on an idea.
 * @param {number|string} id
 * @returns {{ voteCount: number, hasVoted: boolean }}
 */
export async function toggleVote(id) {
  const res = await axios.post(`${BASE}/${id}/vote`, {}, { withCredentials: true })
  return res.data
}

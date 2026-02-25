import axios from 'axios'

const BASE = '/api/evaluations'

/**
 * Admin: submit an evaluation decision for an idea.
 * @param {number|string} ideaId
 * @param {'accepted'|'rejected'} decision
 * @param {string} comment  mandatory
 */
export async function submitEvaluation(ideaId, decision, comment) {
  const res = await axios.post(
    BASE,
    { ideaId, decision, comment },
    { withCredentials: true }
  )
  return res.data
}

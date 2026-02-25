import { useState } from 'react'
import { submitEvaluation } from '../api/evaluationsApi'

/**
 * EvaluationPanel — shown to admins only on the idea detail page.
 * Props:
 *   idea        — the full idea object (with status, evaluation)
 *   onEvaluated — callback(updatedData) after a successful evaluation
 */
export default function EvaluationPanel({ idea, onEvaluated }) {
  const existing = idea.evaluation
  const isFinalized = idea.status === 'accepted' || idea.status === 'rejected'

  const [decision, setDecision] = useState(existing?.decision ?? 'accepted')
  const [comment, setComment]   = useState(existing?.comment  ?? '')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!comment.trim()) {
      setError('A comment is required.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await submitEvaluation(idea.id, decision, comment.trim())
      onEvaluated?.(result)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to submit evaluation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        {isFinalized ? 'Evaluation' : 'Evaluate this Idea'}
      </h2>

      {/* Read-only view when already finalized */}
      {isFinalized && existing ? (
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-gray-600">Decision: </span>
            <span className={existing.decision === 'accepted' ? 'text-accent-600 font-semibold' : 'text-red-600 font-semibold'}>
              {existing.decision.charAt(0).toUpperCase() + existing.decision.slice(1)}
            </span>
          </p>
          <p>
            <span className="font-medium text-gray-600">Comment: </span>
            <span className="text-gray-800">{existing.comment}</span>
          </p>
          {existing.admin_email && (
            <p className="text-gray-500 text-xs">Evaluated by {existing.admin_email}</p>
          )}
        </div>
      ) : (
        /* Editable form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Decision toggle */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Decision</legend>
            <div className="flex gap-4">
              {['accepted', 'rejected'].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value={opt}
                    checked={decision === opt}
                    onChange={() => setDecision(opt)}
                    className="accent-primary-600"
                  />
                  <span className={`text-sm font-medium ${opt === 'accepted' ? 'text-accent-600' : 'text-red-600'}`}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Comment */}
          <div>
            <label htmlFor="eval-comment" className="block text-sm font-medium text-gray-700 mb-1">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              id="eval-comment"
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Explain your decision…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting…' : 'Submit Evaluation'}
          </button>
        </form>
      )}
    </section>
  )
}

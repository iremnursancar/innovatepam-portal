import { useState } from 'react'
import { submitEvaluation } from '../api/evaluationsApi'
import { useAuth } from '../context/AuthContext'

/**
 * EvaluationPanel — shown to admins only on the idea detail page.
 * Props:
 *   idea        — the full idea object (with status, evaluation)
 *   onEvaluated — callback(updatedData) after a successful evaluation
 */
export default function EvaluationPanel({ idea, onEvaluated }) {
  const { user: currentUser } = useAuth()
  const existing = idea.evaluation
  const isFinalized = idea.status === 'accepted' || idea.status === 'rejected'
  const isOwnIdea = currentUser?.id === idea.submitter_id

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
    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        {isFinalized ? 'Evaluation' : 'Evaluate this Idea'}
      </h2>

      {/* Self-evaluation prevention */}
      {isOwnIdea && !isFinalized && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          ⚠️ You cannot evaluate your own idea. Another admin must review it.
        </p>
      )}

      {/* Read-only view when already finalized */}
      {isFinalized && existing ? (
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-gray-500">Decision: </span>
            <span className={existing.decision === 'accepted' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
              {existing.decision.charAt(0).toUpperCase() + existing.decision.slice(1)}
            </span>
          </p>
          <p>
            <span className="font-medium text-gray-500">Comment: </span>
            <span className="text-gray-700">{existing.comment}</span>
          </p>
          {existing.admin_email && (
            <p className="text-gray-400 text-xs">Evaluated by {existing.admin_email}</p>
          )}
        </div>
      ) : isOwnIdea ? null : (
        /* Editable form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Community vote count — public ideas only */}
          {idea.is_public ? (
            <div className="flex items-start gap-3 rounded-lg border border-[#7277F1]/20 bg-[#7277F1]/5 px-4 py-3">
              <span className="text-xl leading-none mt-0.5">👍</span>
              <div>
                <p className="text-sm font-semibold text-[#7277F1]">
                  {idea.voteCount ?? 0} Community Vote{(idea.voteCount ?? 0) !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Community feedback can inform your decision.</p>
              </div>
            </div>
          ) : null}

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
                    className="accent-[#7277F1]"
                  />
                  <span className={`text-sm font-medium ${opt === 'accepted' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Comment */}
          <div>
            <label htmlFor="eval-comment" className="block text-sm font-medium text-gray-700 mb-1">
              Comment <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="eval-comment"
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Explain your decision…"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7277F1]/40 focus:border-[#7277F1] transition-colors"
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md font-semibold px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(315deg, #42055C 20%, #7277F1 100%)' }}
          >
            {loading ? 'Submitting…' : 'Submit Evaluation'}
          </button>
        </form>
      )}
    </section>
  )
}

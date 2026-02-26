import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIdea, setUnderReview } from '../api/ideasApi'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import EvaluationPanel from '../components/EvaluationPanel'
import StatusTimeline from '../components/StatusTimeline'
import VoteButton from '../components/VoteButton'
import { Lock, Globe } from 'lucide-react'

const CATEGORY_LABELS = {
  process_improvement: 'Process Improvement',
  product_idea:        'Product Idea',
  cost_reduction:      'Cost Reduction',
  customer_experience: 'Customer Experience',
  other:               'Other',
}

export default function IdeaDetailPage() {
  const { id }  = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [idea, setIdea]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [reviewLoad, setRevLoad] = useState(false)

  useEffect(() => {
    getIdea(id)
      .then(setIdea)
      .catch(err => setError(err?.response?.data?.error ?? 'Failed to load idea.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSetUnderReview() {
    setRevLoad(true)
    try {
      await setUnderReview(id)
      const refreshed = await getIdea(id)
      setIdea(refreshed)
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to update status.')
    } finally {
      setRevLoad(false)
    }
  }

  /** Called by EvaluationPanel after a successful evaluation */
  async function handleEvaluated() {
    try {
      const refreshed = await getIdea(id)
      setIdea(refreshed)
    } catch { /* keep current state on error */ }
  }

  function handleVoteToggled(result) {
    setIdea(prev => ({ ...prev, voteCount: result.voteCount, hasVoted: result.hasVoted }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-[#7277F1] animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
          <button
            onClick={() => navigate('/ideas')}
            className="mt-4 text-sm text-[#7277F1] hover:opacity-80 hover:underline transition-colors"
          >
            ← Back to Ideas
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/ideas')}
          className="mb-4 text-sm text-[#7277F1] hover:opacity-80 transition-colors"
        >
          ← Back to Ideas
        </button>

        {/* Idea card */}
        <div className="bg-white rounded-2xl border-2 border-[#E8E5FF] shadow-lg p-6">
          {/* Title + badge + vote */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-gray-900">{idea.title}</h1>
            <div className="flex items-center gap-3 flex-shrink-0">
              {idea.is_public
                ? (
                  <VoteButton
                    ideaId={idea.id}
                    initialCount={idea.voteCount ?? 0}
                    initialVoted={idea.hasVoted ?? false}
                    size="md"
                    onToggled={handleVoteToggled}
                  />
                )
                : (
                  <div
                    title="Private ideas cannot be voted on"
                    className="flex flex-col items-center gap-0.5 px-4 py-3 min-w-[60px] rounded-lg border border-[#E8E5FF] bg-gray-50 text-gray-400 cursor-not-allowed select-none"
                  >
                    <Lock className="h-5 w-5" aria-hidden="true" />
                    <span className="text-sm font-semibold">{idea.voteCount ?? 0}</span>
                  </div>
                )
              }
              <StatusBadge status={idea.status} />
            </div>
          </div>

          {/* Privacy badge */}
          <div className="mb-4">
            {idea.is_public
              ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                  <Globe className="h-3 w-3" aria-hidden="true" /> Public
                </span>
              )
              : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">
                  <Lock className="h-3 w-3" aria-hidden="true" /> Private
                </span>
              )
            }
          </div>

          {/* Meta */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-5">
            <div>
              <dt className="font-medium text-gray-500">Category</dt>
              <dd className="text-gray-800">{CATEGORY_LABELS[idea.category] ?? idea.category}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Submitted by</dt>
              <dd className="text-gray-800">{idea.submitter_email}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Date</dt>
              <dd className="text-gray-800">{new Date(idea.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>

          {/* Description */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Description</h2>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{idea.description}</p>
          </div>

          {/* Attachments */}
          {idea.attachments?.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Attachments</h2>
              <ul className="space-y-1">
                {idea.attachments.map(att => (
                  <li key={att.id}>
                    <a
                      href={`/api/attachments/${att.id}/download`}
                      className="inline-flex items-center gap-1.5 text-sm text-[#7277F1] hover:opacity-80 hover:underline transition-colors"
                      download
                    >
                      📎 {att.originalname}
                      <span className="text-gray-400 text-xs">({(att.size / 1024).toFixed(1)} KB)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin: "Mark Under Review" button (if still submitted) */}
          {user?.role === 'admin' && idea.status === 'submitted' && (
            <div className="mt-5">
              {user?.id === idea.submitter_id ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  ⚠️ You cannot perform admin actions on your own ideas.
                </p>
              ) : (
                <button
                  onClick={handleSetUnderReview}
                  disabled={reviewLoad}
                  className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 hover:border-amber-300 disabled:opacity-50 transition-all"
                >
                  {reviewLoad ? 'Updating…' : 'Mark as Under Review'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <StatusTimeline idea={idea} />

        {/* Evaluation section */}
        {user?.role === 'admin' && (
          <EvaluationPanel idea={idea} onEvaluated={handleEvaluated} />
        )}

        {/* Submitter: read-only evaluation result */}
        {user?.role !== 'admin' && idea.evaluation && (
          <section className="mt-6 rounded-2xl border-2 border-[#E8E5FF] bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Evaluation</h2>
            <p className="text-sm">
              <span className="font-medium text-gray-500">Decision: </span>
              <span className={idea.evaluation.decision === 'accepted' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                {idea.evaluation.decision.charAt(0).toUpperCase() + idea.evaluation.decision.slice(1)}
              </span>
            </p>
            <p className="mt-1 text-sm text-gray-600">{idea.evaluation.comment}</p>
          </section>
        )}
      </main>
    </div>
  )
}

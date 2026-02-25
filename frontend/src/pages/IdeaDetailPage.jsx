import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIdea, setUnderReview } from '../api/ideasApi'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import EvaluationPanel from '../components/EvaluationPanel'

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
      const updated = await setUnderReview(id)
      setIdea(prev => ({ ...prev, status: updated.status }))
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to update status.')
    } finally {
      setRevLoad(false)
    }
  }

  /** Called by EvaluationPanel after a successful evaluation */
  function handleEvaluated(result) {
    setIdea(prev => ({ ...prev, status: result.idea.status, evaluation: result.evaluation }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
          <button
            onClick={() => navigate('/ideas')}
            className="mt-4 text-sm text-primary-600 hover:underline"
          >
            ← Back to Ideas
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/ideas')}
          className="mb-4 text-sm text-primary-600 hover:underline"
        >
          ← Back to Ideas
        </button>

        {/* Idea card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {/* Title + badge */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-gray-900">{idea.title}</h1>
            <StatusBadge status={idea.status} />
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
            <p className="text-gray-800 text-sm whitespace-pre-wrap">{idea.description}</p>
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
                      className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
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
              <button
                onClick={handleSetUnderReview}
                disabled={reviewLoad}
                className="rounded-md border border-yellow-400 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 transition-colors"
              >
                {reviewLoad ? 'Updating…' : 'Mark as Under Review'}
              </button>
            </div>
          )}
        </div>

        {/* Evaluation section */}
        {user?.role === 'admin' && (
          <EvaluationPanel idea={idea} onEvaluated={handleEvaluated} />
        )}

        {/* Submitter: read-only evaluation result */}
        {user?.role !== 'admin' && idea.evaluation && (
          <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Evaluation</h2>
            <p className="text-sm">
              <span className="font-medium text-gray-600">Decision: </span>
              <span className={idea.evaluation.decision === 'accepted' ? 'text-accent-600 font-semibold' : 'text-red-600 font-semibold'}>
                {idea.evaluation.decision.charAt(0).toUpperCase() + idea.evaluation.decision.slice(1)}
              </span>
            </p>
            <p className="mt-1 text-sm text-gray-800">{idea.evaluation.comment}</p>
          </section>
        )}
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { listIdeas } from '../api/ideasApi'

const STATUS_LABELS = {
  submitted:    'Submitted',
  under_review: 'Under Review',
}

const STATUS_COLORS = {
  submitted:    'text-blue-600 bg-blue-50 border-blue-200',
  under_review: 'text-amber-700 bg-amber-50 border-amber-200',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PendingQueueCard() {
  const navigate = useNavigate()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    listIdeas()
      .then(ideas => {
        const queue = ideas
          .filter(i => i.status === 'submitted' || i.status === 'under_review')
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // oldest first → most urgent
        setPending(queue)
      })
      .catch(() => setError('Could not load pending ideas.'))
      .finally(() => setLoading(false))
  }, [])

  const preview = pending.slice(0, 5)

  return (
    <div className="rounded-xl border border-amber-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">Pending Review</h2>
            {!loading && !error && (
              <p className="text-xs text-gray-500 mt-0.5">
                {pending.length === 0
                  ? 'No ideas awaiting review'
                  : `${pending.length} idea${pending.length !== 1 ? 's' : ''} awaiting your review`}
              </p>
            )}
          </div>
        </div>
        {!loading && pending.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {pending.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pb-5">
        {loading && (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-amber-500 animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-600 py-4 text-center">{error}</p>
        )}

        {!loading && !error && pending.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">All ideas have been reviewed. 🎉</p>
        )}

        {!loading && !error && preview.length > 0 && (
          <ul className="divide-y divide-gray-100 mb-4">
            {preview.map(idea => (
              <li key={idea.id}>
                <Link
                  to={`/ideas/${idea.id}`}
                  className="flex items-start justify-between gap-3 py-3 hover:text-[#7277F1] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-800 group-hover:text-[#7277F1] truncate transition-colors">
                      {idea.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block text-[11px] font-medium px-1.5 py-0.5 rounded border ${STATUS_COLORS[idea.status] ?? 'text-gray-500 bg-gray-100 border-gray-200'}`}>
                        {STATUS_LABELS[idea.status] ?? idea.status}
                      </span>
                      {idea.is_public === 1 && idea.voteCount != null && (
                        <span className="text-xs text-gray-400">▲ {idea.voteCount}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">{formatDate(idea.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && (
          <button
            onClick={() => navigate('/ideas?filter=pending')}
            className="w-full rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all text-center"
          >
            Review All Pending Ideas →
          </button>
        )}
      </div>
    </div>
  )
}

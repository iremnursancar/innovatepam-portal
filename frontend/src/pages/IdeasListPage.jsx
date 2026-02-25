import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listIdeas } from '../api/ideasApi'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'

const CATEGORY_LABELS = {
  process_improvement: 'Process Improvement',
  product_idea:        'Product Idea',
  cost_reduction:      'Cost Reduction',
  customer_experience: 'Customer Experience',
  other:               'Other',
}

export default function IdeasListPage() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [ideas, setIdeas]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    listIdeas()
      .then(setIdeas)
      .catch(() => setError('Failed to load ideas.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'All Ideas' : 'My Ideas'}
          </h1>
          <button
            onClick={() => navigate('/ideas/new')}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            + New Idea
          </button>
        </div>

        {/* States */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && ideas.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium mb-2">No ideas yet</p>
            <p>
              <Link to="/ideas/new" className="text-primary-600 hover:underline">Submit your first idea</Link>
            </p>
          </div>
        )}

        {/* Idea cards */}
        {!loading && ideas.length > 0 && (
          <div className="space-y-3">
            {ideas.map(idea => (
              <Link
                key={idea.id}
                to={`/ideas/${idea.id}`}
                className="block bg-white rounded-lg border border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-md transition-all p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{idea.title}</h2>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{idea.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span>{CATEGORY_LABELS[idea.category] ?? idea.category}</span>
                      {user?.role === 'admin' && idea.submitter_email && (
                        <span>by {idea.submitter_email}</span>
                      )}
                      <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <StatusBadge status={idea.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

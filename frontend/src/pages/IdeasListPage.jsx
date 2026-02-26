import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { listIdeas } from '../api/ideasApi'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import VoteButton from '../components/VoteButton'
import { X, Lock, Globe } from 'lucide-react'

const CATEGORY_LABELS = {
  process_improvement: 'Process Improvement',
  product_idea:        'Product Idea',
  cost_reduction:      'Cost Reduction',
  customer_experience: 'Customer Experience',
  other:               'Other',
}

const STATUS_LABELS = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  accepted:     'Accepted',
  rejected:     'Rejected',
}

function applyFilters(ideas, { search, status, category, sort }) {
  let out = [...ideas]

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    out = out.filter(
      i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    )
  }

  if (status) {
    const statuses = status.split(',')
    out = out.filter(i => statuses.includes(i.status))
  }
  if (category) out = out.filter(i => i.category === category)

  if (sort === 'oldest') {
    out.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  } else if (sort === 'title_asc') {
    out.sort((a, b) => a.title.localeCompare(b.title))
  } else {
    // newest (default)
    out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  return out
}

const selectClass =
  'rounded-md border border-[#E8E5FF] bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7277F1]/40 focus:border-[#7277F1] transition-colors'

export default function IdeasListPage() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [searchParams] = useSearchParams()
  const [ideas, setIdeas]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Filter state
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')
  const [category, setCategory] = useState('')
  const [sort,     setSort]     = useState('newest')

  // Apply pending filter when navigated from notification bell
  useEffect(() => {
    if (searchParams.get('filter') === 'pending') {
      setStatus('submitted,under_review')
    }
  }, [searchParams])

  useEffect(() => {
    listIdeas()
      .then(setIdeas)
      .catch(() => setError('Failed to load ideas.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => applyFilters(ideas, { search, status, category, sort }),
    [ideas, search, status, category, sort]
  )

  const hasActiveFilters = search || status || category || sort !== 'newest'

  function resetFilters() {
    setSearch('')
    setStatus('')
    setCategory('')
    setSort('newest')
  }

  function handleVoteToggled(ideaId, result) {
    setIdeas(prev => prev.map(i =>
      i.id === ideaId ? { ...i, voteCount: result.voteCount, hasVoted: result.hasVoted } : i
    ))
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'All Ideas' : 'My Ideas'}
          </h1>
          <button
            onClick={() => navigate('/ideas/new')}
            className="rounded-md font-semibold px-4 py-2 text-sm text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8B7AC7 0%, #7277F1 100%)' }}
          >
            + New Idea
          </button>
        </div>

        {/* Filter bar — only when ideas are loaded */}
        {!loading && !error && ideas.length > 0 && (
          <div className="bg-white border-2 border-[#E8E5FF] rounded-xl px-4 py-3 mb-5 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">

              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder="Search title or description…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-md border border-[#E8E5FF] bg-white pl-3 pr-8 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7277F1]/40 focus:border-[#7277F1] transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status */}
              <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
                <option value="">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              {/* Category */}
              <select value={category} onChange={e => setCategory(e.target.value)} className={selectClass}>
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              {/* Sort */}
              <select value={sort} onChange={e => setSort(e.target.value)} className={selectClass}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title_asc">Title A–Z</option>
              </select>

              {/* Reset */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-400 hover:text-[#7277F1] transition-colors whitespace-nowrap"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Results count */}
            <p className="mt-2 text-xs text-gray-500">
              Showing {filtered.length} of {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-[#7277F1] animate-spin" />
          </div>
        )}

        {/* Fetch error */}
        {error && (
          <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        {/* Empty — no ideas at all */}
        {!loading && !error && ideas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-2">No ideas yet</p>
            <p>
              <Link to="/ideas/new" className="text-[#7277F1] hover:opacity-80 hover:underline transition-colors">Submit your first idea</Link>
            </p>
          </div>
        )}

        {/* Empty — filters produced no results */}
        {!loading && !error && ideas.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-base font-medium mb-1">No ideas match your filters</p>
            <button onClick={resetFilters} className="text-sm text-[#7277F1] hover:opacity-80 hover:underline transition-colors">
              Clear filters
            </button>
          </div>
        )}

        {/* Idea cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(idea => (
              <div
                key={idea.id}
                className="flex items-stretch bg-white rounded-2xl border-2 border-[#E8E5FF] shadow-lg hover:-translate-y-0.5 hover:border-[#7277F1]/40 hover:shadow-xl transition-all duration-200"
              >
                {/* Vote column — only for public ideas */}
                <div className="flex items-center px-3 py-4 border-r border-gray-100">
                  {idea.is_public
                    ? (
                      <VoteButton
                        ideaId={idea.id}
                        initialCount={idea.voteCount ?? 0}
                        initialVoted={idea.hasVoted ?? false}
                        onToggled={result => handleVoteToggled(idea.id, result)}
                      />
                    )
                    : (
                      <div
                        title="Private ideas cannot be voted on"
                        className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 min-w-[44px] rounded-lg border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed select-none"
                      >
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-semibold">{idea.voteCount ?? 0}</span>
                      </div>
                    )
                  }
                </div>

                {/* Card body — navigates to detail */}
                <Link
                  to={`/ideas/${idea.id}`}
                  className="flex-1 min-w-0 p-4"
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
                        {/* Privacy badge */}
                        {idea.is_public
                          ? <span className="inline-flex items-center gap-0.5 text-emerald-600"><Globe className="h-3 w-3" aria-hidden="true" />Public</span>
                          : <span className="inline-flex items-center gap-0.5 text-gray-400"><Lock className="h-3 w-3" aria-hidden="true" />Private</span>
                        }
                      </div>
                    </div>
                    <StatusBadge status={idea.status} />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

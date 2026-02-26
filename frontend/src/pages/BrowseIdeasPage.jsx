import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { listIdeas } from '../api/ideasApi'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import VoteButton from '../components/VoteButton'
import { X, Globe } from 'lucide-react'

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
    out = out.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
  }
  if (status) {
    const statuses = status.split(',')
    out = out.filter(i => statuses.includes(i.status))
  }
  if (category) out = out.filter(i => i.category === category)
  if (sort === 'votes') {
    out.sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
  } else if (sort === 'oldest') {
    out.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  } else if (sort === 'title_asc') {
    out.sort((a, b) => a.title.localeCompare(b.title))
  } else {
    out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
  return out
}

const selectClass =
  'rounded-md border border-navy-border bg-navy-950/60 px-3 py-1.5 text-sm text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors'

export default function BrowseIdeasPage() {
  const { user }   = useAuth()
  const [ideas, setIdeas]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')
  const [category, setCategory] = useState('')
  const [sort,     setSort]     = useState('newest')

  useEffect(() => {
    listIdeas()
      .then(all => {
        // Only public ideas from other users
        setIdeas(all.filter(i => i.is_public === 1 && i.submitter_id !== user?.id))
      })
      .catch(() => setError('Failed to load community ideas.'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const filtered = useMemo(
    () => applyFilters(ideas, { search, status, category, sort }),
    [ideas, search, status, category, sort]
  )

  const hasActiveFilters = search || status || category || sort !== 'newest'
  function resetFilters() { setSearch(''); setStatus(''); setCategory(''); setSort('newest') }

  function handleVoteToggled(ideaId, result) {
    setIdeas(prev => prev.map(i =>
      i.id === ideaId ? { ...i, voteCount: result.voteCount, hasVoted: result.hasVoted } : i
    ))
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Browse Community Ideas</h1>
            <p className="text-sm text-slate-500 mt-0.5">Discover and vote on public ideas from your colleagues</p>
          </div>
        </div>

        {!loading && !error && ideas.length > 0 && (
          <div className="bg-navy-card/80 backdrop-blur-sm border border-navy-border rounded-lg px-4 py-3 mb-5 shadow-card-dark">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder="Search title or description…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-md border border-navy-border bg-navy-950/60 pl-3 pr-8 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" aria-label="Clear search">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
                <option value="" className="bg-navy-900">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val} className="bg-navy-900">{label}</option>
                ))}
              </select>
              <select value={category} onChange={e => setCategory(e.target.value)} className={selectClass}>
                <option value="" className="bg-navy-900">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val} className="bg-navy-900">{label}</option>
                ))}
              </select>
              <select value={sort} onChange={e => setSort(e.target.value)} className={selectClass}>
                <option value="newest"    className="bg-navy-900">Newest</option>
                <option value="votes"     className="bg-navy-900">Most Voted</option>
                <option value="oldest"    className="bg-navy-900">Oldest</option>
                <option value="title_asc" className="bg-navy-900">Title A–Z</option>
              </select>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors whitespace-nowrap">Reset filters</button>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Showing {filtered.length} of {ideas.length} public idea{ideas.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-cyan-800 border-t-cyan-400 animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-md bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}

        {!loading && !error && ideas.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium mb-1">No public ideas yet</p>
            <p className="text-sm">Be the first to share a public idea with the community.</p>
          </div>
        )}

        {!loading && !error && ideas.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-base font-medium mb-1">No ideas match your filters</p>
            <button onClick={resetFilters} className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">Clear filters</button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(idea => (
              <div key={idea.id} className="flex items-stretch bg-navy-card/90 backdrop-blur-sm rounded-lg border border-navy-border shadow-card-dark hover:border-cyan-500/30 hover:shadow-[0_4px_20px_rgba(6,182,212,0.08)] transition-all duration-200">
                <div className="flex items-center px-3 py-4 border-r border-navy-border/60">
                  <VoteButton
                    ideaId={idea.id}
                    initialCount={idea.voteCount ?? 0}
                    initialVoted={idea.hasVoted ?? false}
                    onToggled={result => handleVoteToggled(idea.id, result)}
                  />
                </div>
                <Link to={`/ideas/${idea.id}`} className="flex-1 min-w-0 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-slate-100 truncate">{idea.title}</h2>
                      <p className="mt-1 text-sm text-slate-400 line-clamp-2">{idea.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{CATEGORY_LABELS[idea.category] ?? idea.category}</span>
                        {idea.submitter_email && <span>by {idea.submitter_email}</span>}
                        <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-0.5 text-emerald-400">
                          <Globe className="h-3 w-3" aria-hidden="true" />Public
                        </span>
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

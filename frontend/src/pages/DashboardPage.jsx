import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PlusCircle, ClipboardList, Globe, Clock, Lightbulb, CheckCircle2, ThumbsUp } from 'lucide-react'
import Navbar          from '../components/Navbar'
import ActivityFeed    from '../components/ActivityFeed'
import StatisticsPanel from '../components/StatisticsPanel'
import { fetchStats } from '../api/statsApi'
import { listIdeas }  from '../api/ideasApi'

const ACCENT        = '#7277F1'
const ACCENT_BG     = 'rgba(114, 119, 241, 0.12)'
const CARD_GRADIENT = 'linear-gradient(315deg, #42055C 20%, #7277F1 100%)'
const ICON_GRADIENT = 'linear-gradient(135deg, #8B7AC7 0%, #7277F1 100%)'

export default function DashboardPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const isAdmin    = user?.role === 'admin'
  const name       = user?.email ? user.email.split('@')[0] : 'there'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const [pendingCount, setPendingCount] = useState(null)
  const [userStats, setUserStats] = useState({ myIdeas: 0, accepted: 0, totalVotes: 0 })

  useEffect(() => {
    if (isAdmin) {
      fetchStats()
        .then(s => setPendingCount(s.pendingReview ?? 0))
        .catch(() => {})
    } else {
      listIdeas()
        .then(ideas => {
          const own = ideas.filter(i => i.submitter_email === user?.email)
          setUserStats({
            myIdeas:    own.length,
            accepted:   own.filter(i => i.status === 'accepted').length,
            totalVotes: own.reduce((sum, i) => sum + (i.voteCount ?? 0), 0),
          })
        })
        .catch(() => {})
    }
  }, [isAdmin, user?.email])

  return (
    <div className="min-h-screen bg-[#FAF9FB]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Welcome section ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {name}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">{today}</p>
        </div>

        {/* ── User stats (regular users only) ── */}
        {!isAdmin && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'My Ideas',    value: userStats.myIdeas,    Icon: Lightbulb    },
              { label: 'Accepted',    value: userStats.accepted,   Icon: CheckCircle2 },
              { label: 'Total Votes', value: userStats.totalVotes, Icon: ThumbsUp     },
            ].map(({ label, value, Icon }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border-2 border-[#E8E5FF] shadow-lg px-6 py-5 flex items-center gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: ICON_GRADIENT }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Quick-action cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

          {isAdmin ? (
            <>
              {/* Admin card 1: Browse All Ideas */}
              <button onClick={() => navigate('/ideas')} className="group block text-left focus:outline-none w-full">
                <div className="h-full bg-white rounded-2xl border-2 border-[#E8E5FF] shadow-lg p-8 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-[#7277F1]/40 transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-[#7277F1]/50">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: ICON_GRADIENT }}>
                    <ClipboardList className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Browse All Ideas</h3>
                  <p className="text-sm text-gray-500">View all ideas in the system.</p>
                </div>
              </button>

              {/* Admin card 2: Review Pending Ideas */}
              <button onClick={() => navigate('/ideas?filter=pending')} className="group block text-left focus:outline-none w-full">
                <div className="h-full bg-white rounded-2xl border-2 border-[#E8E5FF] shadow-lg p-8 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-[#7277F1]/40 transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-[#7277F1]/50">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: ICON_GRADIENT }}>
                    <Clock className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Review Pending Ideas</h3>
                  <p className="text-sm text-gray-500">
                    {pendingCount !== null
                      ? `${pendingCount} idea${pendingCount !== 1 ? 's' : ''} awaiting your review.`
                      : 'Ideas awaiting your review.'}
                  </p>
                </div>
              </button>

              {/* Admin card 3: Submit New Idea */}
              <Link to="/ideas/new" className="group block focus:outline-none">
                <div className="h-full bg-white rounded-2xl border-2 border-[#E8E5FF] shadow-lg p-8 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-[#7277F1]/40 transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-[#7277F1]/50">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: ICON_GRADIENT }}>
                    <PlusCircle className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Submit New Idea</h3>
                  <p className="text-sm text-gray-500">Share your innovation with the team.</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              {/* User card 1: My Ideas */}
              <Link to="/ideas/my" className="group block focus:outline-none">
                <div className="h-full bg-white rounded-2xl border-2 border-[#E8E5FF] shadow-lg p-8 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-[#7277F1]/40 transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-[#7277F1]/50">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: ICON_GRADIENT }}>
                    <ClipboardList className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">My Ideas</h3>
                  <p className="text-sm text-gray-500">View your submitted ideas and check their status.</p>
                </div>
              </Link>

              {/* User card 2: Browse Community Ideas */}
              <Link to="/ideas/browse" className="group block focus:outline-none">
                <div className="h-full bg-white rounded-2xl border-2 border-[#E8E5FF] shadow-lg p-8 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-[#7277F1]/40 transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-[#7277F1]/50">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: ICON_GRADIENT }}>
                    <Globe className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Browse Community Ideas</h3>
                  <p className="text-sm text-gray-500">Discover and vote on public ideas from colleagues.</p>
                </div>
              </Link>

              {/* User card 3: Submit New Idea */}
              <Link to="/ideas/new" className="group block focus:outline-none">
                <div className="h-full bg-white rounded-2xl border-2 border-[#E8E5FF] shadow-lg p-8 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-[#7277F1]/40 transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-[#7277F1]/50">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: ICON_GRADIENT }}>
                    <PlusCircle className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Submit New Idea</h3>
                  <p className="text-sm text-gray-500">Share your innovation with the team.</p>
                </div>
              </Link>
            </>
          )}

        </div>

        {/* Statistics — admin only */}
        {isAdmin && (
          <div className="mb-8">
            <StatisticsPanel />
          </div>
        )}

        {/* Activity Feed — admin only */}
        {user?.role === 'admin' && <ActivityFeed />}
      </main>
    </div>
  )
}

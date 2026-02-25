import { useEffect, useState, useCallback } from 'react'
import { Send, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { listActivities } from '../api/activitiesApi'

const POLL_INTERVAL_MS = 30_000

/** Map activity type → icon component + colour classes */
const TYPE_CONFIG = {
  idea_submitted:    { Icon: Send,        colour: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'submitted'       },
  idea_under_review: { Icon: Eye,         colour: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'moved to review' },
  idea_accepted:     { Icon: CheckCircle, colour: 'text-emerald-400',bg: 'bg-emerald-500/10',label: 'accepted'        },
  idea_rejected:     { Icon: XCircle,     colour: 'text-rose-400',   bg: 'bg-rose-500/10',   label: 'rejected'        },
}

/** Returns a human-readable relative time string, e.g. "5 minutes ago". */
function timeAgo(isoString) {
  const diffMs  = Date.now() - new Date(isoString).getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60)       return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60)       return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  const diffHr  = Math.floor(diffMin / 60)
  if (diffHr  < 24)       return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr  / 24)
  return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchActivities = useCallback(async () => {
    try {
      const data = await listActivities()
      setActivities(data)
      setError('')
      setLastRefresh(new Date())
    } catch {
      setError('Could not load activity feed.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + polling
  useEffect(() => {
    fetchActivities()
    const timer = setInterval(fetchActivities, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [fetchActivities])

  // Refresh relative timestamps every minute so they stay accurate
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-navy-card/90 backdrop-blur-sm rounded-xl border border-navy-border shadow-card-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-border/60">
        <h2 className="text-sm font-semibold text-slate-200 tracking-tight">Activity Feed</h2>
        <button
          onClick={fetchActivities}
          title="Refresh"
          className="text-slate-500 hover:text-cyan-400 transition-colors"
          aria-label="Refresh activity feed"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="divide-y divide-navy-border/40">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 rounded-full border-2 border-cyan-800 border-t-cyan-400 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <p className="px-5 py-4 text-sm text-rose-400">{error}</p>
        )}

        {!loading && !error && activities.length === 0 && (
          <p className="px-5 py-6 text-sm text-center text-slate-500">No activity yet.</p>
        )}

        {!loading && activities.map(activity => {
          const cfg = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.idea_submitted
          const { Icon, colour, bg } = cfg
          const verb = cfg.label

          return (
            <div key={activity.id} className="flex items-start gap-3 px-5 py-3 hover:bg-navy-800/30 transition-colors">
              {/* Icon bubble */}
              <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${bg}`}>
                <Icon className={`h-3.5 w-3.5 ${colour}`} aria-hidden="true" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 leading-snug">
                  <span className="font-medium text-slate-100">{activity.user_email}</span>
                  {' '}{verb}{' '}
                  <span className="font-medium text-slate-100">&ldquo;{activity.idea_title}&rdquo;</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{timeAgo(activity.timestamp)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer: last refreshed */}
      {lastRefresh && !loading && (
        <div className="px-5 py-2 border-t border-navy-border/30">
          <p className="text-xs text-slate-600">
            Auto-refreshes every 30 s &middot; last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { Send, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { listActivities } from '../api/activitiesApi'

const POLL_INTERVAL_MS = 30_000

/** Map activity type → icon component + colour classes */
const TYPE_CONFIG = {
  idea_submitted:    { Icon: Send,        colour: 'text-blue-600',    bg: 'bg-blue-50',    label: 'submitted'       },
  idea_under_review: { Icon: Eye,         colour: 'text-amber-600',   bg: 'bg-amber-50',   label: 'moved to review' },
  idea_accepted:     { Icon: CheckCircle, colour: 'text-emerald-600', bg: 'bg-emerald-50', label: 'accepted'        },
  idea_rejected:     { Icon: XCircle,     colour: 'text-rose-600',    bg: 'bg-rose-50',    label: 'rejected'        },
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
    <div className="bg-white rounded-2xl border border-[#EBEBEB] shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 tracking-tight">Activity Feed</h2>
        <button
          onClick={fetchActivities}
          title="Refresh"
          className="text-gray-400 hover:text-[#7277F1] transition-colors"
          aria-label="Refresh activity feed"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-100">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-[#7277F1] animate-spin" />
          </div>
        )}

        {!loading && error && (
          <p className="px-6 py-5 text-sm text-rose-600">{error}</p>
        )}

        {!loading && !error && activities.length === 0 && (
          <p className="px-6 py-8 text-sm text-center text-gray-400">No activity yet.</p>
        )}

        {!loading && activities.map(activity => {
          const cfg = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.idea_submitted
          const { Icon, colour, bg } = cfg
          const verb = cfg.label

          return (
            <div key={activity.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              {/* Icon bubble */}
              <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`h-4 w-4 ${colour}`} aria-hidden="true" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 leading-snug">
                  <span className="font-medium text-gray-900">{activity.user_email}</span>
                  {' '}{verb}{' '}
                  <span className="font-medium text-gray-900">&ldquo;{activity.idea_title}&rdquo;</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{timeAgo(activity.timestamp)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer: last refreshed */}
      {lastRefresh && !loading && (
        <div className="px-6 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Auto-refreshes every 30 s &middot; last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}

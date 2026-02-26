import { Send, Eye, CheckCircle2, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
  submitted:    { Icon: Send,         color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    label: 'Submitted'    },
  under_review: { Icon: Eye,          color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Under Review' },
  accepted:     { Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Accepted'     },
  rejected:     { Icon: XCircle,      color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',    label: 'Rejected'     },
}

function formatDateTime(isoString) {
  const d = new Date(isoString)
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Build a history array from whatever data is available.
 * If the backend returned a full statusHistory array, use it.
 * Otherwise synthesise a single entry from the current idea state.
 */
function buildHistory(idea) {
  if (Array.isArray(idea.statusHistory) && idea.statusHistory.length > 0) {
    return idea.statusHistory.map(h => ({
      status:    h.status,
      changedBy: h.changed_by,
      timestamp: h.timestamp,
    }))
  }

  // Fallback: single entry from idea data
  return [
    {
      status:    idea.status,
      changedBy: idea.submitter_email ?? 'unknown',
      timestamp: idea.updated_at ?? idea.created_at,
    },
  ]
}

export default function StatusTimeline({ idea }) {
  const history = buildHistory(idea)

  return (
    <section aria-label="Status timeline" className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Status Timeline
      </h2>

      <ol className="relative">
        {history.map((entry, idx) => {
          const cfg  = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.submitted
          const { Icon, color, bg, border, label } = cfg
          const isLast = idx === history.length - 1

          return (
            <li key={idx} className="flex gap-4">
              {/* Left column: icon + connecting line */}
              <div className="flex flex-col items-center">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full border ${bg} ${border} flex items-center justify-center z-10`}>
                  <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-gray-200 my-1" aria-hidden="true" />
                )}
              </div>

              {/* Right column: text */}
              <div className={`pb-5 ${isLast ? '' : ''}`}>
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  by <span className="font-medium text-gray-700">{entry.changedBy}</span>
                  {' · '}
                  {formatDateTime(entry.timestamp)}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

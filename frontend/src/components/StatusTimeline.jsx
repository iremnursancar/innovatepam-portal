import { Send, Eye, CheckCircle2, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
  submitted:    { Icon: Send,         color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/25',    label: 'Submitted'    },
  under_review: { Icon: Eye,          color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   label: 'Under Review' },
  accepted:     { Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', label: 'Accepted'     },
  rejected:     { Icon: XCircle,      color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    label: 'Rejected'     },
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
    <section aria-label="Status timeline" className="mt-6 bg-navy-card/90 backdrop-blur-sm rounded-lg border border-navy-border shadow-card-dark p-5">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
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
                  <div className="w-px flex-1 bg-navy-border/50 my-1" aria-hidden="true" />
                )}
              </div>

              {/* Right column: text */}
              <div className={`pb-5 ${isLast ? '' : ''}`}>
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  by <span className="font-medium text-slate-300">{entry.changedBy}</span>
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

import { useEffect, useState } from 'react'
import {
  Layers, Clock, CheckCircle2, XCircle, TrendingUp, Tag,
} from 'lucide-react'
import { fetchStats } from '../api/statsApi'

const CATEGORY_LABELS = {
  process_improvement: 'Process Improvement',
  product_idea:        'Product Idea',
  cost_reduction:      'Cost Reduction',
  customer_experience: 'Customer Experience',
  other:               'Other',
}

/** Individual stat card */
function StatCard({ icon: Icon, value, label, colorClasses }) {
  const { border, iconBg, iconText, valueText } = colorClasses
  return (
    <div className={`rounded-xl border ${border} bg-navy-card/80 backdrop-blur-sm p-5 flex flex-col gap-3 shadow-card-dark hover:shadow-card-hover transition-shadow`}>
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${iconText}`} aria-hidden="true" />
      </div>
      <div>
        <p className={`text-3xl font-bold ${valueText}`}>{value}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

const COLORS = {
  blue:  { border: 'border-blue-500/20',    iconBg: 'bg-blue-500/10',   iconText: 'text-blue-400',   valueText: 'text-blue-300'   },
  amber: { border: 'border-amber-500/20',   iconBg: 'bg-amber-500/10',  iconText: 'text-amber-400',  valueText: 'text-amber-300'  },
  green: { border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/10',iconText: 'text-emerald-400',valueText: 'text-emerald-300' },
  red:   { border: 'border-rose-500/20',    iconBg: 'bg-rose-500/10',   iconText: 'text-rose-400',   valueText: 'text-rose-300'   },
  teal:  { border: 'border-teal-500/20',    iconBg: 'bg-teal-500/10',   iconText: 'text-teal-400',   valueText: 'text-teal-300'   },
  violet:{ border: 'border-violet-500/20',  iconBg: 'bg-violet-500/10', iconText: 'text-violet-400', valueText: 'text-violet-300'  },
}

export default function StatisticsPanel() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError('Could not load statistics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-6 w-6 rounded-full border-2 border-cyan-800 border-t-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="rounded-md bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
        {error}
      </p>
    )
  }

  const popularLabel = stats.mostPopularCategory
    ? (CATEGORY_LABELS[stats.mostPopularCategory] ?? stats.mostPopularCategory)
    : '—'

  const cards = [
    { icon: Layers,      value: stats.totalIdeas,      label: 'Total Ideas',         color: 'blue'   },
    { icon: Clock,       value: stats.pendingReview,   label: 'Pending Review',      color: 'amber'  },
    { icon: CheckCircle2,value: stats.acceptedIdeas,   label: 'Accepted',            color: 'green'  },
    { icon: XCircle,     value: stats.rejectedIdeas,   label: 'Rejected',            color: 'red'    },
    { icon: TrendingUp,  value: `${stats.acceptanceRate}%`, label: 'Acceptance Rate', color: 'teal'  },
    { icon: Tag,         value: popularLabel,          label: 'Top Category',        color: 'violet' },
  ]

  return (
    <section aria-label="Statistics">
      <h2 className="text-xs font-semibold text-slate-500 mb-3 tracking-widest uppercase">
        Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(({ icon, value, label, color }) => (
          <StatCard
            key={label}
            icon={icon}
            value={value}
            label={label}
            colorClasses={COLORS[color]}
          />
        ))}
      </div>
    </section>
  )
}

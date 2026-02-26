import { useEffect, useState } from 'react'
import {
  Layers, Clock, CheckCircle2, XCircle, TrendingUp, Tag, Download,
} from 'lucide-react'
import { fetchStats } from '../api/statsApi'
import apiClient from '../api/apiClient'

const CATEGORY_LABELS = {
  process_improvement: 'Process Improvement',
  product_idea:        'Product Idea',
  cost_reduction:      'Cost Reduction',
  customer_experience: 'Customer Experience',
  other:               'Other',
}

/** Individual stat card */
function StatCard({ icon: Icon, value, label, colorClasses }) {
  const { border, valueText } = colorClasses
  return (
    <div className={`rounded-2xl border-2 border-[#E8E5FF] bg-white p-6 flex flex-col gap-4 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default`}>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #8B7AC7 0%, #7277F1 100%)' }}
      >
        <Icon className="h-5 w-5 text-white" aria-hidden="true" />
      </div>
      <div>
        <p className={`text-4xl font-bold ${valueText} leading-none`}>{value}</p>
        <p className="text-sm text-gray-500 mt-1.5">{label}</p>
      </div>
    </div>
  )
}

const COLORS = {
  blue:  { border: 'border-blue-100',     valueText: 'text-blue-700'    },
  amber: { border: 'border-amber-100',    valueText: 'text-amber-700'   },
  green: { border: 'border-emerald-100',  valueText: 'text-emerald-700' },
  red:   { border: 'border-rose-100',     valueText: 'text-rose-700'    },
  teal:  { border: 'border-teal-100',     valueText: 'text-teal-700'    },
  violet:{ border: 'border-[#7277F1]/15', valueText: 'text-[#7277F1]'   },
}

export default function StatisticsPanel() {
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [exporting,  setExporting]  = useState(false)

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError('Could not load statistics.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleExport() {
    setExporting(true)
    try {
      const response = await apiClient.get('/ideas/export', { responseType: 'blob' })
      const url  = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `ideas-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      // silently ignore — user can retry
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-[#7277F1] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
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
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Overview</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#7277F1] hover:border-[#7277F1]/40 disabled:opacity-50 transition-all"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

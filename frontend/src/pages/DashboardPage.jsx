import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Card, CardHeader, CardTitle, CardContent,
} from '../components/ui/card'
import { Lightbulb, PlusCircle, ClipboardList } from 'lucide-react'
import Navbar        from '../components/Navbar'
import ActivityFeed  from '../components/ActivityFeed'
import StatisticsPanel from '../components/StatisticsPanel'

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="mt-1 text-slate-400">
            {isAdmin
              ? "You're signed in as an administrator. Review ideas and track all activity."
              : 'Share your ideas and track their progress from submission to decision.'}
          </p>
        </div>

        {/* Quick-action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

          {/* Browse Ideas */}
          <Link to="/ideas" className="group block focus:outline-none">
            <Card className="h-full hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-cyan-500/50">
              <CardHeader>
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center mb-2 group-hover:bg-cyan-500/20 transition-colors">
                  <ClipboardList className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">Browse Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  {isAdmin
                    ? 'View all submitted ideas and record evaluations.'
                    : 'See your submitted ideas and check their status.'}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Submit New Idea */}
          <Link to="/ideas/new" className="group block focus:outline-none">
            <Card className="h-full hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-emerald-500/50">
              <CardHeader>
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center mb-2 group-hover:bg-emerald-500/20 transition-colors">
                  <PlusCircle className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">Submit New Idea</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  Got an idea? Submit it for review and track its progress.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Admin: quick view of idea backlog */}
          {isAdmin && (
            <Link to="/ideas" className="group block focus:outline-none">
              <Card className="h-full hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-violet-500/50">
                <CardHeader>
                  <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center mb-2 group-hover:bg-violet-500/20 transition-colors">
                    <Lightbulb className="h-5 w-5 text-violet-400" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-base">Evaluate Ideas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">
                    Accept or reject ideas with a mandatory comment.
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

        </div>

        {/* Statistics — admin only */}
        {isAdmin && (
          <div className="mb-8">
            <StatisticsPanel />
          </div>
        )}

        {/* Activity Feed */}
        <ActivityFeed />
      </main>
    </div>
  )
}

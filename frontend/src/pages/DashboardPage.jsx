import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { Button }      from '../components/ui/button'
import {
  Card, CardHeader, CardTitle, CardContent,
} from '../components/ui/card'
import { LogOut, Lightbulb, Users } from 'lucide-react'

/** Role badge rendered next to the user's name */
function RoleBadge({ role }) {
  const isAdmin = role === 'admin'
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        isAdmin
          ? 'bg-accent-100 text-accent-800'
          : 'bg-primary-100 text-primary-800',
      ].join(' ')}
      aria-label={`Role: ${role}`}
    >
      {isAdmin ? 'Admin' : 'Submitter'}
    </span>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Nav bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">I</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">InnovatEPAM</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{user?.email}</span>
              <RoleBadge role={user?.role} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome banner */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h2>
          <p className="mt-1 text-gray-500">
            {user?.role === 'admin'
              ? "You're signed in as an administrator. Review and evaluate submitted ideas below."
              : "Share your ideas and track their progress from submission to decision."}
          </p>
        </div>

        {/* Quick-action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group border-blue-100">
            <CardHeader>
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-primary-200 transition-colors">
                <Lightbulb className="h-5 w-5 text-primary-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-base">Ideas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {user?.role === 'admin'
                  ? 'Review all submitted ideas and record evaluations.'
                  : 'Browse your submitted ideas and check their status.'}
              </p>
              <p className="mt-3 text-xs text-gray-400 italic">
                Available in Phase 4 (US2 + US3)
              </p>
            </CardContent>
          </Card>

          {user?.role === 'admin' && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer group border-accent-100">
              <CardHeader>
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-accent-200 transition-colors">
                  <Users className="h-5 w-5 text-accent-600" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">Evaluations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Accept or reject ideas with a mandatory comment.
                </p>
                <p className="mt-3 text-xs text-gray-400 italic">
                  Available in Phase 6 (US4)
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

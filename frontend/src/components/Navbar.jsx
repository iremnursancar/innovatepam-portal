import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard } from 'lucide-react'

function navLinkClass({ isActive }) {
  return [
    'font-medium transition-all duration-200',
    isActive
      ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'
      : 'text-slate-400 hover:text-cyan-400',
  ].join(' ')
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-navy-border/80 bg-[#0d2137]/80 backdrop-blur-xl shadow-[0_1px_0_rgba(45,55,72,0.6)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent"
        >
          InnovatEPAM
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-5 text-sm">
          <NavLink to="/" end className={navLinkClass}>
            <span className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </span>
          </NavLink>
          <NavLink to="/ideas" className={navLinkClass}>
            Ideas
          </NavLink>
          <NavLink to="/ideas/new" className={navLinkClass}>
            Submit Idea
          </NavLink>
        </nav>

        {/* User info + logout */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500 hidden sm:inline">{user?.email}</span>
          {user?.role === 'admin' && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Admin
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-rose-400 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard } from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'

function navLinkClass({ isActive }) {
  return [
    'text-sm font-medium transition-colors duration-200',
    isActive
      ? 'text-[#7277F1]'
      : 'text-gray-500 hover:text-[#7277F1]',
  ].join(' ')
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.email ? user.email.split('@')[0] : ''

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8E5FF] bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center text-xl tracking-tight select-none">
          <span className="font-medium text-gray-700">Innovat</span>
          <span
            className="font-bold bg-gradient-to-r from-[#7277F1] to-[#42055C] bg-clip-text text-transparent"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >{'<epam>'}</span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-5 text-sm">
          <NavLink to="/" end className={navLinkClass}>
            <span className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </span>
          </NavLink>
          {user?.role === 'admin' ? (
            <NavLink to="/ideas" className={navLinkClass}>Ideas</NavLink>
          ) : (
            <>
              <NavLink to="/ideas/my" className={navLinkClass}>My Ideas</NavLink>
              <NavLink to="/ideas/browse" className={navLinkClass}>Browse Ideas</NavLink>
            </>
          )}
          <NavLink to="/ideas/new" className={navLinkClass}>Submit Idea</NavLink>
        </nav>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:inline">{displayName}</span>
          {user?.role === 'admin' ? (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8B7AC7 0%, #7277F1 100%)' }}
            >
              Admin
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#7277F1]/10 text-[#7277F1] border border-[#7277F1]/20">
              User
            </span>
          )}
          {/* Notification bell dropdown */}
          <NotificationDropdown />

          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-rose-500 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/ideas" className="text-primary-600 font-bold text-lg tracking-tight">
          InnovatEPAM
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/ideas"
            className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
          >
            Ideas
          </Link>
          <Link
            to="/ideas/new"
            className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
          >
            Submit Idea
          </Link>
        </nav>

        {/* User info + logout */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 hidden sm:inline">{user?.email}</span>
          {user?.role === 'admin' && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
              Admin
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-600 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps routes that require authentication.
 * Unauthenticated users are redirected to /login with the intended path
 * preserved in location state so they can be sent back after sign-in.
 *
 * Shows a full-screen loading state while the initial auth check is in flight.
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        aria-label="Checking authentication…"
      >
        <div className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

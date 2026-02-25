import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Restricts access to admin users.
 * Non-admin authenticated users are redirected to the ideas list (/).
 *
 * Must be used inside a <ProtectedRoute> so that auth check already ran.
 */
export default function AdminRoute() {
  const { user } = useAuth()

  if (!user) {
    // Should not happen if wrapped in ProtectedRoute, but guard just in case
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

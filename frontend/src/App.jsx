import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// Auth pages
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Protected pages
import IdeasListPage   from './pages/IdeasListPage'
import SubmitIdeaPage  from './pages/SubmitIdeaPage'
import IdeaDetailPage  from './pages/IdeaDetailPage'

import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/ideas" replace />} />
          <Route path="/ideas"      element={<IdeasListPage />} />
          <Route path="/ideas/new"  element={<SubmitIdeaPage />} />
          <Route path="/ideas/:id"  element={<IdeaDetailPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/ideas" replace />} />
      </Routes>
    </AuthProvider>
  )
}

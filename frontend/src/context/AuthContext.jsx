import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as authApi from '../api/authApi'

const AuthContext = createContext(null)

/**
 * Provides authentication state and actions to the component tree.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    authApi.getMe()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const loggedIn = await authApi.login(email, password)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback(async (email, password) => {
    const created = await authApi.register(email, password)
    setUser(created)
    return created
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook — throws if used outside AuthProvider */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

import apiClient from './apiClient'

/** POST /api/auth/register */
export async function register(email, password) {
  const { data } = await apiClient.post('/auth/register', { email, password })
  return data.user
}

/** POST /api/auth/login */
export async function login(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password })
  return data.user
}

/** POST /api/auth/logout */
export async function logout() {
  await apiClient.post('/auth/logout')
}

/** GET /api/auth/me — returns current user or null */
export async function getMe() {
  try {
    const { data } = await apiClient.get('/auth/me')
    return data.user
  } catch {
    return null
  }
}

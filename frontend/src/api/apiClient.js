import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  withCredentials: true, // send httpOnly cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
})

// Normalise error messages so callers can always read err.message
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ??
      error.message ??
      'An unexpected error occurred.'
    return Promise.reject(Object.assign(error, { message }))
  }
)

export default apiClient

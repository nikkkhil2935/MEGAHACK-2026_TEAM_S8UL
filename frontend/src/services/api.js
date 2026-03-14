import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
  timeout: 30000
})

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('careerbridge-auth')
  const token = stored ? JSON.parse(stored)?.state?.token : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    const url = err.config?.url || ''
    // Don't redirect on auth endpoints — let the login/register page handle errors
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('careerbridge-auth')
      window.location.href = '/login'
    }
    if (err.response?.status === 429 && !err.config?._skipRateLimitToast) toast.error('Rate limit hit — wait 1 minute')
    return Promise.reject(err)
  }
)

export default api

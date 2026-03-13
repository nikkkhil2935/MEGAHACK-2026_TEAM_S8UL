import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth'
import FormLabel from '../components/auth/FormLabel'
import { getHomeRoute } from '../constants'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login, loginWithGoogle } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success('Welcome back!')
      navigate(getHomeRoute(user?.role))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      toast.error('Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-black/95 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c1ff72]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 md:p-12 w-full max-w-md shadow-lg border border-black/5 dark:border-white/5 relative z-10 hover:shadow-xl transition-shadow">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-[#c1ff72] text-xl font-bold mx-auto mb-6 shadow-md hover:scale-105 transition-transform">CB</div>
          <h1 className="text-3xl font-display font-medium text-foreground tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-3 font-medium">Please enter your details to continue.</p>
        </div>

        <button onClick={handleGoogleLogin} disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-gray-100 dark:border-surface-700 hover:border-gray-200 dark:hover:border-surface-600 bg-transparent text-foreground text-sm font-bold transition-all mb-8 disabled:opacity-50 cursor-pointer hover:shadow-sm">
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-200 dark:bg-surface-700" />
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-surface-700" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-2xl px-5 py-3.5 bg-[#f8f9fa] dark:bg-surface-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c1ff72] transition-colors border border-transparent focus:border-transparent text-foreground" 
                placeholder="Email Address" required />
            </div>
          </div>
          <div>
            <div className="relative">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-2xl px-5 py-3.5 bg-[#f8f9fa] dark:bg-surface-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c1ff72] transition-colors border border-transparent focus:border-transparent text-foreground" 
                placeholder="Password" required />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black py-4 rounded-2xl text-sm font-bold shadow-md hover:bg-black dark:hover:bg-gray-100 transition-all hover:-translate-y-0.5 disabled:opacity-50 mt-4 cursor-pointer">
            {loading ? <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin mx-auto" /> :
              'Sign in'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-foreground hover:text-[#c1ff72] dark:hover:text-[#c1ff72] font-bold transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

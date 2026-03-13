import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Building2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth'
import FormLabel from '../components/auth/FormLabel'
import Logo from '../components/common/Logo'
import { ROLES, getHomeRoute } from '../constants'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: ROLES.CANDIDATE, company_name: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await register(form)
      toast.success('Account created!')
      navigate(getHomeRoute(user?.role), { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-black/95 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c1ff72]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-surface-900 rounded-[32px] p-8 md:p-10 w-full max-w-md shadow-lg border border-black/5 dark:border-white/5 relative z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" className="mb-6 shadow-sm" />
          <h1 className="text-2xl font-display font-bold text-foreground">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join CareerBridge AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selector */}
          <div>
            <FormLabel spacing="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">I am a</FormLabel>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(ROLES).map(role => (
                <button key={role} type="button" onClick={() => setForm(f => ({ ...f, role }))}
                  className={`py-3 px-4 rounded-2xl text-sm font-medium transition-all ${
                    form.role === role
                      ? 'bg-gray-100 dark:bg-surface-700 border-2 border-gray-200 dark:border-gray-600 text-foreground shadow-sm'
                      : 'bg-transparent border-2 border-gray-100 dark:border-surface-700 text-gray-400 hover:border-gray-200 dark:hover:border-surface-600'
                  }`}>
                  {role === ROLES.CANDIDATE ? 'Job Seeker' : 'Recruiter'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FormLabel spacing="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</FormLabel>
            <div className="relative">
              <User size={18} className="absolute left-4 top-3.5 text-gray-400" />
              <input type="text" value={form.full_name} onChange={set('full_name')}
                className="w-full rounded-2xl pl-11 pr-5 py-3.5 bg-transparent border-2 border-gray-100 dark:border-surface-700 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-surface-500 transition-colors text-foreground" 
                placeholder="Your full name" required />
            </div>
          </div>

          <div>
            <FormLabel spacing="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</FormLabel>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-3.5 text-gray-400" />
              <input type="email" value={form.email} onChange={set('email')}
                className="w-full rounded-2xl pl-11 pr-5 py-3.5 bg-transparent border-2 border-gray-100 dark:border-surface-700 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-surface-500 transition-colors text-foreground" 
                placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <FormLabel spacing="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Password</FormLabel>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-3.5 text-gray-400" />
              <input type="password" value={form.password} onChange={set('password')}
                className="w-full rounded-2xl pl-11 pr-5 py-3.5 bg-transparent border-2 border-gray-100 dark:border-surface-700 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-surface-500 transition-colors text-foreground" 
                placeholder="Min 6 characters" required minLength={6} />
            </div>
          </div>

          {form.role === ROLES.RECRUITER && (
            <div>
              <FormLabel spacing="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name</FormLabel>
              <div className="relative">
                <Building2 size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input type="text" value={form.company_name} onChange={set('company_name')}
                  className="w-full rounded-2xl pl-11 pr-5 py-3.5 bg-transparent border-2 border-gray-100 dark:border-surface-700 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-300 dark:focus:border-surface-500 transition-colors text-foreground" 
                  placeholder="Your company" />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black py-4 rounded-2xl text-sm font-bold shadow-md hover:bg-black dark:hover:bg-gray-100 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" /> :
              <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:white transition-colors">Sign In</Link>
        </p>
      </motion.div>
    </div>
  )
}

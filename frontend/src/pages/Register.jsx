import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Building2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/auth'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'candidate', company_name: '' })
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
      navigate(user?.role === 'recruiter' ? '/recruiter' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold mx-auto mb-4">CB</div>
          <h1 className="text-2xl font-display font-bold text-foreground">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Join CareerBridge AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {['candidate', 'recruiter'].map(role => (
                <button key={role} type="button" onClick={() => setForm(f => ({ ...f, role }))}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium capitalize border transition-all cursor-pointer ${
                    form.role === role
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'bg-surface-700 border-white/5 text-gray-400 hover:border-white/20'
                  }`}>
                  {role === 'candidate' ? 'Job Seeker' : 'Recruiter'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <input type="text" value={form.full_name} onChange={set('full_name')}
                className="input-field pl-10" placeholder="Your full name" required />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <input type="email" value={form.email} onChange={set('email')}
                className="input-field pl-10" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <input type="password" value={form.password} onChange={set('password')}
                className="input-field pl-10" placeholder="Min 6 characters" required minLength={6} />
            </div>
          </div>

          {form.role === 'recruiter' && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Company Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-3.5 text-gray-500" />
                <input type="text" value={form.company_name} onChange={set('company_name')}
                  className="input-field pl-10" placeholder="Your company" />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
              <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign In</Link>
        </p>
      </motion.div>
    </div>
  )
}

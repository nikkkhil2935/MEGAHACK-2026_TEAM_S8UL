import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Briefcase, User, TrendingUp, Award, Target } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/auth'

function StatCard({ icon: Icon, label, value, color = 'text-brand-400' }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center">
          <Icon size={16} className={color} />
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <div className={`text-3xl font-display font-bold ${color}`}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/candidate').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-white mb-1">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-400 text-sm mb-8">Here's your career overview.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Briefcase} label="Applications" value={data?.total_applications || 0} />
          <StatCard icon={Mic} label="Interviews" value={data?.total_interviews || 0} color="text-accent-400" />
          <StatCard icon={TrendingUp} label="Avg Match" value={`${data?.avg_match_score || 0}%`} color="text-green-400" />
          <StatCard icon={Award} label="Avg Interview" value={data?.avg_interview_score || 0} color="text-yellow-400" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/interview" className="glass-card p-5 hover:border-brand-500/30 transition-colors group">
            <Mic size={20} className="text-brand-400 mb-3" />
            <h3 className="text-white font-semibold mb-1">Take Mock Interview</h3>
            <p className="text-gray-500 text-sm">AI-powered voice interview with cross-examination</p>
          </Link>
          <Link to="/profile" className="glass-card p-5 hover:border-accent-500/30 transition-colors group">
            <User size={20} className="text-accent-400 mb-3" />
            <h3 className="text-white font-semibold mb-1">Update Profile</h3>
            <p className="text-gray-500 text-sm">Import LinkedIn or upload resume</p>
          </Link>
          <Link to="/jobs" className="glass-card p-5 hover:border-green-500/30 transition-colors group">
            <Target size={20} className="text-green-400 mb-3" />
            <h3 className="text-white font-semibold mb-1">Browse Jobs</h3>
            <p className="text-gray-500 text-sm">See live match scores for every role</p>
          </Link>
        </div>

        {/* Recent Interviews */}
        {data?.recent_interviews?.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-white font-semibold mb-4">Recent Interviews</h2>
            <div className="space-y-3">
              {data.recent_interviews.map(interview => (
                <Link key={interview.id} to={`/interview/report/${interview.id}`}
                  className="flex items-center justify-between p-3 bg-surface-700 rounded-xl hover:bg-surface-600 transition-colors">
                  <div>
                    <div className="text-sm text-white font-medium capitalize">
                      {interview.job_postings?.title || interview.interview_type} Interview
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(interview.started_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold font-mono ${
                      interview.overall_score >= 75 ? 'text-green-400' :
                      interview.overall_score >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{interview.overall_score}/100</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

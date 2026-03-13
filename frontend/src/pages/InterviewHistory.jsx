import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Shield, TrendingUp, ArrowRight } from 'lucide-react'
import api from '../services/api'

export default function InterviewHistory() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/interview/history').then(r => setSessions(r.data)).finally(() => setLoading(false))
  }, [])

  const scoreColor = (s) => s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Interview History</h1>
          <Link to="/interview" className="btn-primary text-sm py-2">New Interview</Link>
        </div>

        {sessions.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-400 mb-4">No interviews yet. Take your first AI mock interview!</p>
            <Link to="/interview" className="btn-primary inline-flex items-center gap-2">Start Interview <ArrowRight size={16} /></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Link to={`/interview/report/${s.id}`}
                  className="glass-card p-5 flex items-center justify-between hover:border-white/10 transition-colors block">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-foreground font-medium">{s.job_postings?.title || s.interview_type}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-700 text-gray-400 capitalize">{s.interview_type}</span>
                      {s.language && s.language !== 'en' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-accent-500/20 text-accent-400 uppercase">{s.language}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={12} />{new Date(s.started_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                      <span className="flex items-center gap-1"><Shield size={12} />Integrity: {s.integrity_score || 100}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-display font-bold ${scoreColor(s.overall_score)}`}>{s.overall_score}</div>
                      <div className="text-xs text-gray-500">/100</div>
                    </div>
                    <ArrowRight size={16} className="text-gray-500" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

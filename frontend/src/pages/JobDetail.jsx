import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, ArrowLeft, Send, Map } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useGamificationStore } from '../store/gamification'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [match, setMatch] = useState(null)
  const [applying, setApplying] = useState(false)
  const { awardXP } = useGamificationStore()

  useEffect(() => {
    api.get(`/jobs/${id}`).then(r => setJob(r.data))
    api.get(`/jobs/match/${id}`).then(r => setMatch(r.data)).catch(() => {})
  }, [id])

  const handleApply = async () => {
    setApplying(true)
    try {
      await api.post(`/jobs/${id}/apply`)
      toast.success('Application submitted!')
      awardXP(20, 'Applied for a Job 💼')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Application failed')
    } finally {
      setApplying(false)
    }
  }

  if (!job) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const scoreColor = (s) => s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/jobs" className="text-gray-400 hover:text-foreground text-sm flex items-center gap-1 mb-6">
          <ArrowLeft size={14} /> Back to Jobs
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="glass-card p-6 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">{job.title}</h1>
                <p className="text-gray-400">{job.company}</p>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  {job.location && <span className="flex items-center gap-1"><MapPin size={14} />{job.location}</span>}
                  <span className="capitalize">{job.remote_policy}</span>
                </div>
              </div>
              {match?.match_score !== undefined && (
                <div className="text-center">
                  <div className={`text-4xl font-display font-bold ${scoreColor(match.match_score)}`}>
                    {match.match_score}%
                  </div>
                  <div className="text-xs text-gray-500">match</div>
                  <div className={`text-xs font-medium mt-1 ${scoreColor(match.match_score)}`}>
                    {match.verdict}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleApply} disabled={applying}
              className="btn-primary mt-4 flex items-center gap-2 disabled:opacity-50">
              <Send size={16} /> {applying ? 'Applying...' : 'Apply Now'}
            </button>
            {match?.missing_skills?.length > 0 && (
              <button onClick={() => navigate(`/roadmap?skills=${encodeURIComponent(match.missing_skills.map(s => s.name || s).join(','))}`)}
                className="btn-ghost mt-2 flex items-center gap-2 text-sm">
                <Map size={16} /> Build Roadmap for Missing Skills
              </button>
            )}
          </div>

          {/* Match Details */}
          {match && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {match.matched_skills?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-green-400 font-semibold text-sm mb-3">Matched Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {match.matched_skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-green-500/10 text-green-300 border border-green-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {match.missing_skills?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-red-400 font-semibold text-sm mb-3">Missing Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {match.missing_skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-red-500/10 text-red-300 border border-red-500/20">
                        {s.name || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="glass-card p-6">
            <h3 className="text-foreground font-semibold mb-3">Job Description</h3>
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

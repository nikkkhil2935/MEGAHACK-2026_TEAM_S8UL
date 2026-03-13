import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Users, Star, Mail, Download, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function ViewJobApplications() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    try {
      const [jobRes, appRes] = await Promise.all([
        api.get(`/jobs/${id}`).catch(() => null),
        api.get(`/jobs/${id}/applicants`).catch(() => null)
      ])
      if (jobRes?.data) setJob(jobRes.data)
      if (appRes?.data) setApplicants(appRes.data)
    } catch {
      toast.error('Failed to load applications')
    } finally { setLoading(false) }
  }

  function getScoreColor(score) {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-400" size={32} />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/recruiter')}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      {job && (
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">{job.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{job.company} {job.location ? `• ${job.location}` : ''}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-brand-400" />
        <span className="text-sm text-gray-400">{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</span>
      </div>

      {applicants.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>No applications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).map((app, i) => (
            <motion.div key={app.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface-800 border border-white/5 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
                    <span className="text-brand-400 font-bold text-sm">
                      {(app.name || app.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{app.name || app.email || 'Anonymous'}</div>
                    <div className="text-xs text-gray-400">{app.email || 'No email'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {app.match_score != null && (
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(app.match_score)}`}>{app.match_score}%</div>
                      <div className="text-[10px] text-gray-500">match</div>
                    </div>
                  )}
                  {expanded === i ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>
              </button>

              {expanded === i && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {app.skills?.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {app.skills.map(s => (
                            <span key={s} className="text-xs px-2 py-0.5 bg-brand-500/10 rounded text-brand-400">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {app.experience && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Experience</div>
                        <div className="text-gray-300">{app.experience}</div>
                      </div>
                    )}
                    {app.interview_score != null && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Interview Score</div>
                        <div className={`font-bold ${getScoreColor(app.interview_score)}`}>{app.interview_score}%</div>
                      </div>
                    )}
                    {app.applied_at && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Applied</div>
                        <div className="text-gray-300">{new Date(app.applied_at).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

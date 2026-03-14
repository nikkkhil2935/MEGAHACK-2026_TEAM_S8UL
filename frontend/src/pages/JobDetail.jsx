import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ArrowLeft, Send, Map, MessageSquare, DollarSign, Clock, Briefcase, ChevronDown, ChevronUp, Mic, Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useGamificationStore } from '../store/gamification'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const mockJob = location.state?.mockJob
  const isMock = id.startsWith('mock-')
  const [job, setJob] = useState(mockJob || null)
  const [match, setMatch] = useState(null)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [generatingCL, setGeneratingCL] = useState(false)
  const { awardXP } = useGamificationStore()

  useEffect(() => {
    if (isMock) return
    api.get(`/jobs/${id}`).then(r => setJob(r.data))
    api.get(`/jobs/match/${id}`).then(r => setMatch(r.data)).catch(() => {})
  }, [id, isMock])

  const handleApply = async () => {
    if (isMock) {
      toast.error('This is a sample job. Real jobs will be available when a recruiter posts them.')
      return
    }
    setApplying(true)
    try {
      await api.post(`/jobs/${id}/apply`, { cover_letter: coverLetter || null })
      toast.success('Application submitted!')
      awardXP(20, 'Applied for a Job')
      setApplied(true)
      setShowForm(false)
    } catch (err) {
      const msg = err.response?.data?.error
      if (err.response?.status === 409) {
        toast.error('You have already applied to this job.')
        setApplied(true)
      } else {
        toast.error(msg || 'Application failed')
      }
    } finally {
      setApplying(false)
    }
  }

  const handleMessageRecruiter = () => {
    if (isMock) {
      toast.error('Messaging is available for real job postings only.')
      return
    }
    if (job?.recruiter_id) {
      navigate(`/messaging?startChat=${job.recruiter_id}`)
    } else {
      navigate('/messaging')
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (isMock) {
      toast.error('AI generation is available for real job postings only.')
      return
    }
    setGeneratingCL(true)
    try {
      const { data } = await api.post('/jobs/generate-cover-letter', { job_id: id })
      if (data.cover_letter) {
        setCoverLetter(data.cover_letter)
        toast.success('Cover letter generated!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate cover letter')
    } finally {
      setGeneratingCL(false)
    }
  }

  if (!job) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const scoreColor = (s) => s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = (s) => s >= 75 ? 'bg-green-500/10 border-green-500/20' : s >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/jobs" className="text-gray-400 hover:text-foreground text-sm flex items-center gap-1 mb-6">
          <ArrowLeft size={14} /> Back to Jobs
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {isMock && (
            <div className="text-xs text-center text-gray-500 mb-4 bg-surface-800 border border-white/5 rounded-xl py-2.5">
              This is a sample job listing for preview purposes.
            </div>
          )}

          {/* Header */}
          <div className="glass-card p-6 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-display font-bold text-foreground">{job.title}</h1>
                <p className="text-gray-400 text-lg">{job.company}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                  {job.location && <span className="flex items-center gap-1"><MapPin size={14} />{job.location}</span>}
                  <span className="capitalize flex items-center gap-1"><Briefcase size={14} />{job.remote_policy}</span>
                  {job.job_category && <span className="px-2.5 py-0.5 bg-brand-500/10 text-brand-300 border border-brand-500/20 rounded-full text-xs">{job.job_category}</span>}
                </div>
                {(job.salary_range || job.experience) && (
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                    {job.salary_range && <span className="flex items-center gap-1 text-green-400"><DollarSign size={14} />{job.salary_range}</span>}
                    {job.experience && <span className="flex items-center gap-1 text-gray-400"><Clock size={14} />{job.experience}</span>}
                  </div>
                )}
              </div>
              {match?.match_score !== undefined && (
                <div className={`text-center p-4 rounded-xl border ${scoreBg(match.match_score)}`}>
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

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-5">
              {!applied ? (
                <button onClick={() => setShowForm(f => !f)}
                  className="btn-primary flex items-center gap-2">
                  <Send size={16} /> Apply Now
                  {showForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              ) : (
                <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                  Applied
                </div>
              )}
              <button onClick={handleMessageRecruiter}
                className="btn-ghost flex items-center gap-2 text-sm">
                <MessageSquare size={16} /> Message Recruiter
              </button>
              <button onClick={() => navigate(`/interview?job_id=${id}`)}
                className="btn-ghost flex items-center gap-2 text-sm">
                <Mic size={16} /> Practice Interview
              </button>
              {match?.missing_skills?.length > 0 && (
                <button onClick={() => navigate(`/roadmap?skills=${encodeURIComponent(match.missing_skills.map(s => s.name || s).join(','))}`)}
                  className="btn-ghost flex items-center gap-2 text-sm">
                  <Map size={16} /> Build Roadmap
                </button>
              )}
            </div>
          </div>

          {/* Application Form */}
          <AnimatePresence>
            {showForm && !applied && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-5">
                <div className="glass-card p-6">
                  <h3 className="text-foreground font-semibold mb-3">Apply for {job.title}</h3>
                  <p className="text-gray-500 text-xs mb-4">Your profile and resume will be sent automatically. Add an optional cover letter below.</p>
                  <div className="relative mb-4">
                    <textarea
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      rows={6}
                      placeholder="Write a brief cover letter (optional) — explain why you're a great fit for this role..."
                      className="input-field w-full resize-none"
                    />
                    <button
                      onClick={handleGenerateCoverLetter}
                      disabled={generatingCL}
                      className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-brand-500/20"
                    >
                      {generatingCL ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {generatingCL ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleApply} disabled={applying}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50">
                      <Send size={16} /> {applying ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button onClick={() => setShowForm(false)}
                      className="btn-ghost text-sm">Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Required Skills */}
          {job.required_skills?.length > 0 && (
            <div className="glass-card p-5 mb-5">
              <h3 className="text-foreground font-semibold text-sm mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.required_skills.map((s, i) => {
                  const skillName = s.name || s
                  const isMatched = match?.matched_skills?.some(ms => (ms.name || ms).toLowerCase() === skillName.toLowerCase())
                  return (
                    <span key={i} className={`px-2.5 py-1 rounded-full text-xs border ${isMatched
                      ? 'bg-green-500/10 text-green-300 border-green-500/20'
                      : 'bg-surface-700 text-gray-400 border-white/5'}`}>
                      {skillName}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

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

          {/* Recruiter Info */}
          {job.recruiter && (
            <div className="glass-card p-5 mb-5">
              <h3 className="text-foreground font-semibold text-sm mb-3">Posted By</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-300 font-bold text-sm">
                  {job.recruiter.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">{job.recruiter.name}</p>
                  <p className="text-gray-500 text-xs">{job.recruiter.email}</p>
                </div>
                <button onClick={handleMessageRecruiter}
                  className="ml-auto btn-ghost text-xs flex items-center gap-1">
                  <MessageSquare size={14} /> Message
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="glass-card p-6">
            <h3 className="text-foreground font-semibold mb-3">Job Description</h3>
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
              {job.description || `This is a sample listing for ${job.title} at ${job.company}. Full job descriptions will appear here for real job postings.`}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

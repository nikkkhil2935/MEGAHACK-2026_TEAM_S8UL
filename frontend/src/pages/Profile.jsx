import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, RefreshCw, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profileText, setProfileText] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    api.get('/resume/parsed').then(r => {
      setProfile(r.data)
      setProfileText('')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const importProfile = async () => {
    if (!profileText.trim() || profileText.trim().length < 20) {
      toast.error('Please paste a meaningful profile summary (at least 20 characters)')
      return
    }
    setImporting(true)
    try {
      const { data } = await api.post('/linkedin/import', { profile_text: profileText })
      setProfile(prev => ({ ...prev, parsed_data: data.parsed, completeness_score: data.completeness }))
      toast.success('Profile imported successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const uploadResume = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('resume', file)
    try {
      const { data } = await api.post('/resume/upload', formData)
      setProfile(prev => ({ ...prev, parsed_data: data.parsed, resume_url: data.resume_url }))
      toast.success('Resume parsed successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const parsed = profile?.parsed_data
  const scoreColor = (s) => s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-white mb-6">Your Profile</h1>

          {/* Import Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Profile Text Import */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FileText size={16} className="text-blue-400" />
                Import Profile
              </h3>
              <textarea value={profileText} onChange={e => setProfileText(e.target.value)}
                className="input-field text-sm mb-2 min-h-[120px] resize-y"
                placeholder="Paste your LinkedIn profile text or any professional summary here" />
              <button onClick={importProfile} disabled={importing}
                className="btn-primary px-4 py-2 text-sm flex items-center gap-1 disabled:opacity-50 w-full justify-center">
                {importing ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                Import
              </button>
            </div>

            {/* Resume Upload */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Upload size={16} className="text-green-400" />
                Upload Resume PDF
              </h3>
              <input ref={fileRef} type="file" accept=".pdf" onChange={uploadResume} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full border-2 border-dashed border-white/10 rounded-xl p-4 text-gray-400 text-sm hover:border-brand-500/30 hover:text-brand-400 transition-colors cursor-pointer disabled:opacity-50">
                {uploading ? 'Parsing resume...' : 'Click to upload PDF'}
              </button>
            </div>
          </div>

          {/* Completeness Score */}
          {profile?.completeness_score !== undefined && (
            <div className="glass-card p-4 mb-6 flex items-center justify-between">
              <span className="text-sm text-gray-400">Profile Completeness</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${profile.completeness_score}%` }} />
                </div>
                <span className={`font-bold font-mono text-sm ${scoreColor(profile.completeness_score)}`}>
                  {profile.completeness_score}%
                </span>
              </div>
            </div>
          )}

          {/* Parsed Profile */}
          {parsed ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-display font-bold text-white">{parsed.name || 'Your Name'}</h2>
                {parsed.headline && <p className="text-gray-400 text-sm mt-1">{parsed.headline}</p>}
                {parsed.location && <p className="text-gray-500 text-xs mt-1">{parsed.location}</p>}
                {parsed.summary && <p className="text-gray-300 text-sm mt-3">{parsed.summary}</p>}
              </div>

              {/* Skills */}
              {parsed.skills?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsed.skills.map((s, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {s.name || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {parsed.experience?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold mb-3">Experience</h3>
                  <div className="space-y-4">
                    {parsed.experience.map((exp, i) => (
                      <div key={i} className="border-l-2 border-brand-500/30 pl-4">
                        <h4 className="text-white text-sm font-medium">{exp.role}</h4>
                        <p className="text-gray-400 text-xs">{exp.company} {exp.start && `| ${exp.start} - ${exp.end || 'Present'}`}</p>
                        {exp.bullets?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {exp.bullets.map((b, j) => (
                              <li key={j} className="text-gray-400 text-xs flex gap-2">
                                <span className="text-brand-500">-</span> {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {parsed.projects?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold mb-3">Projects</h3>
                  <div className="space-y-3">
                    {parsed.projects.map((proj, i) => (
                      <div key={i} className="p-3 bg-surface-700 rounded-xl">
                        <h4 className="text-white text-sm font-medium">{proj.name}</h4>
                        {proj.tech?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {proj.tech.map((t, j) => (
                              <span key={j} className="text-xs text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        )}
                        {proj.description && <p className="text-gray-400 text-xs mt-2">{proj.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {parsed.education?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold mb-3">Education</h3>
                  <div className="space-y-3">
                    {parsed.education.map((edu, i) => (
                      <div key={i}>
                        <h4 className="text-white text-sm font-medium">{edu.degree} {edu.field && `in ${edu.field}`}</h4>
                        <p className="text-gray-400 text-xs">{edu.institution} {edu.year && `| ${edu.year}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <AlertCircle size={32} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">No Profile Data Yet</h3>
              <p className="text-gray-400 text-sm">Import your LinkedIn profile or upload your resume to get started.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

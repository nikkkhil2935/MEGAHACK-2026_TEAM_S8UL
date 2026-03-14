import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, RefreshCw, Check, AlertCircle, Camera, Pencil, Save, X, CheckCircle, Grid3X3 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/auth'

const AVATAR_STYLES = [
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'adventurer-neutral', label: 'Neutral' },
  { id: 'avataaars', label: 'Avataaars' },
  { id: 'big-ears', label: 'Big Ears' },
  { id: 'bottts', label: 'Robots' },
  { id: 'fun-emoji', label: 'Emoji' },
  { id: 'lorelei', label: 'Lorelei' },
  { id: 'notionists', label: 'Notionists' },
  { id: 'pixel-art', label: 'Pixel Art' },
  { id: 'thumbs', label: 'Thumbs' },
]

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Luna', 'Milo', 'Zoe', 'Kai', 'Nova', 'Rex', 'Iris', 'Leo', 'Cleo', 'Dash', 'Sage', 'Juno', 'Orion', 'Piper']

function getAvatarUrl(style, seed) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profileText, setProfileText] = useState('')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [verifiedSkills, setVerifiedSkills] = useState([])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [avatarStyle, setAvatarStyle] = useState('adventurer')
  const [savingAvatar, setSavingAvatar] = useState(false)
  const fileRef = useRef(null)
  const avatarRef = useRef(null)

  useEffect(() => {
    api.get('/resume/parsed').then(r => {
      setProfile(r.data)
      setProfileText('')
    }).catch(() => {}).finally(() => setLoading(false))
    api.get('/github/verified-skills').then(r => setVerifiedSkills(r.data.verifiedSkills || [])).catch(() => {})
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

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const { data } = await api.post('/auth/avatar', formData)
      setUser(data.user)
      toast.success('Photo updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const selectAvatar = async (avatarUrl) => {
    setSavingAvatar(true)
    try {
      const { data } = await api.put('/auth/profile', { avatar_url: avatarUrl })
      setUser(data.user)
      setShowAvatarPicker(false)
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update avatar')
    } finally {
      setSavingAvatar(false)
    }
  }

  const startEditing = () => {
    const p = profile?.parsed_data || {}
    setEditData({
      name: p.name || user?.full_name || '',
      headline: p.headline || '',
      location: p.location || '',
      summary: p.summary || '',
      skills: (p.skills || []).map(s => s.name || s).join(', '),
    })
    setEditing(true)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const currentParsed = profile?.parsed_data || {}
      const updatedParsed = {
        ...currentParsed,
        name: editData.name,
        headline: editData.headline,
        location: editData.location,
        summary: editData.summary,
        skills: editData.skills.split(',').map(s => s.trim()).filter(Boolean),
      }

      await api.put('/resume/update', { parsed_data: updatedParsed })

      // Also update full_name in profiles table
      if (editData.name !== user?.full_name) {
        const { data } = await api.put('/auth/profile', { full_name: editData.name })
        setUser(data.user)
      }

      setProfile(prev => ({ ...prev, parsed_data: updatedParsed }))
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const parsed = profile?.parsed_data
  const scoreColor = (s) => s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'
  const isSkillVerified = (skillName) => {
    const name = (skillName?.name || skillName || '').toLowerCase()
    return verifiedSkills.find(vs => vs.verified && vs.skill?.toLowerCase() === name)
  }

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">Your Profile</h1>

          {/* Avatar & Basic Info Card */}
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-6">
              {/* Avatar with upload */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full bg-surface-700 border-2 border-surface-600 overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                      {(parsed?.name || user?.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button
                      onClick={() => avatarRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                      title="Upload photo"
                    >
                      {uploadingAvatar ? (
                        <RefreshCw size={14} className="text-white animate-spin" />
                      ) : (
                        <Camera size={14} className="text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowAvatarPicker(true)}
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                      title="Choose avatar"
                    >
                      <Grid3X3 size={14} className="text-white" />
                    </button>
                  </div>
                </div>
                <input ref={avatarRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
              </div>

              {/* Name & Info */}
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <input value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                      placeholder="Full Name" className="input-field text-lg font-bold" />
                    <input value={editData.headline} onChange={e => setEditData(d => ({ ...d, headline: e.target.value }))}
                      placeholder="Professional Headline (e.g. Full Stack Developer)" className="input-field text-sm" />
                    <input value={editData.location} onChange={e => setEditData(d => ({ ...d, location: e.target.value }))}
                      placeholder="Location (e.g. Mumbai, India)" className="input-field text-sm" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-display font-bold text-foreground">{parsed?.name || user?.full_name || 'Your Name'}</h2>
                    {(parsed?.headline) && <p className="text-gray-400 text-sm mt-1">{parsed.headline}</p>}
                    {(parsed?.location) && <p className="text-gray-500 text-xs mt-1">{parsed.location}</p>}
                    <p className="text-gray-500 text-xs mt-1">{user?.email}</p>
                  </>
                )}
              </div>

              {/* Edit / Save buttons */}
              <div className="shrink-0">
                {editing ? (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="p-2 rounded-xl bg-surface-700 text-gray-400 hover:text-foreground transition-colors">
                      <X size={18} />
                    </button>
                    <button onClick={saveProfile} disabled={saving}
                      className="flex items-center gap-1 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
                      {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      Save
                    </button>
                  </div>
                ) : (
                  <button onClick={startEditing}
                    className="flex items-center gap-1 px-4 py-2 bg-surface-700 hover:bg-surface-600 text-foreground rounded-xl text-sm font-medium transition-colors">
                    <Pencil size={14} /> Edit
                  </button>
                )}
              </div>
            </div>

            {/* Summary edit */}
            {editing && (
              <div className="mt-4">
                <textarea value={editData.summary} onChange={e => setEditData(d => ({ ...d, summary: e.target.value }))}
                  placeholder="Professional summary..." className="input-field text-sm min-h-[80px] resize-y w-full" />
                <div className="mt-3">
                  <label className="text-xs text-gray-500 block mb-1">Skills (comma-separated)</label>
                  <input value={editData.skills} onChange={e => setEditData(d => ({ ...d, skills: e.target.value }))}
                    placeholder="React, Node.js, Python, etc." className="input-field text-sm w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Import Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Profile Text Import */}
            <div className="glass-card p-5">
              <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
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
              <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
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

          {/* Parsed Profile Display (read-only view) */}
          {parsed && !editing ? (
            <div className="space-y-5">
              {/* Summary */}
              {parsed.summary && (
                <div className="glass-card p-5">
                  <h3 className="text-foreground font-semibold mb-3">Summary</h3>
                  <p className="text-gray-300 text-sm">{parsed.summary}</p>
                </div>
              )}

              {/* Skills */}
              {parsed.skills?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-foreground font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsed.skills.map((s, i) => {
                      const verified = isSkillVerified(s)
                      return (
                        <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                          verified
                            ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                            : 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                        }`}>
                          {s.name || s}
                          {verified && <CheckCircle size={12} className="text-green-400" />}
                        </span>
                      )
                    })}
                  </div>
                  {verifiedSkills.length > 0 && (
                    <p className="text-xs text-foreground/40 mt-3 flex items-center gap-1">
                      <CheckCircle size={10} className="text-green-400" /> Skills with green badge are verified against your GitHub repositories
                    </p>
                  )}
                </div>
              )}

              {/* Experience */}
              {parsed.experience?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-foreground font-semibold mb-3">Experience</h3>
                  <div className="space-y-4">
                    {parsed.experience.map((exp, i) => (
                      <div key={i} className="border-l-2 border-brand-500/30 pl-4">
                        <h4 className="text-foreground text-sm font-medium">{exp.role}</h4>
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
                  <h3 className="text-foreground font-semibold mb-3">Projects</h3>
                  <div className="space-y-3">
                    {parsed.projects.map((proj, i) => (
                      <div key={i} className="p-3 bg-surface-700 rounded-xl">
                        <h4 className="text-foreground text-sm font-medium">{proj.name}</h4>
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
                  <h3 className="text-foreground font-semibold mb-3">Education</h3>
                  <div className="space-y-3">
                    {parsed.education.map((edu, i) => (
                      <div key={i}>
                        <h4 className="text-foreground text-sm font-medium">{edu.degree} {edu.field && `in ${edu.field}`}</h4>
                        <p className="text-gray-400 text-xs">{edu.institution} {edu.year && `| ${edu.year}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !editing && (
            <div className="glass-card p-8 text-center">
              <AlertCircle size={32} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-1">No Profile Data Yet</h3>
              <p className="text-gray-400 text-sm">Import your LinkedIn profile or upload your resume to get started.</p>
            </div>
          )}
        </motion.div>

        {/* Avatar Picker Modal */}
        <AnimatePresence>
          {showAvatarPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
              onClick={() => setShowAvatarPicker(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-surface-800 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-display font-bold text-foreground">Choose an Avatar</h3>
                  <button onClick={() => setShowAvatarPicker(false)} className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-foreground transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Style Tabs */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {AVATAR_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setAvatarStyle(style.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        avatarStyle === style.id
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-700 text-gray-400 hover:text-foreground hover:bg-surface-600'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>

                {/* Avatar Grid */}
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_SEEDS.map(seed => {
                    const url = getAvatarUrl(avatarStyle, seed)
                    const isSelected = user?.avatar_url === url
                    return (
                      <button
                        key={seed}
                        onClick={() => selectAvatar(url)}
                        disabled={savingAvatar}
                        className={`relative aspect-square rounded-xl p-2 transition-all hover:scale-105 cursor-pointer ${
                          isSelected
                            ? 'bg-brand-500/20 border-2 border-brand-500 ring-2 ring-brand-500/30'
                            : 'bg-surface-700 border-2 border-transparent hover:border-white/20'
                        } disabled:opacity-50`}
                      >
                        <img src={url} alt={seed} className="w-full h-full rounded-lg" loading="lazy" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {savingAvatar && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-400">
                    <RefreshCw size={14} className="animate-spin" /> Saving...
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const REMOTE_OPTIONS = ['remote', 'hybrid', 'onsite']

export default function PostJob() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    tech_stack: '',
    salary_range: '',
    remote_policy: 'hybrid',
    experience_level: 'mid',
    application_deadline: ''
  })

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.company || !form.description) {
      toast.error('Fill in required fields')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        requirements: form.requirements.split('\n').filter(Boolean),
        tech_stack: form.tech_stack.split(',').map(s => s.trim()).filter(Boolean)
      }
      await api.post('/jobs', payload)
      toast.success('Job posted successfully!')
      navigate('/recruiter')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post job')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/recruiter')}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Briefcase size={24} className="text-brand-400" /> Post New Job
        </h1>
        <p className="text-sm text-gray-400 mt-1">AI will auto-match qualified candidates</p>
      </div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface-800 border border-white/5 rounded-xl p-6 space-y-5">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Job Title *</label>
            <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
              placeholder="Senior Frontend Engineer"
              className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Company *</label>
            <input type="text" value={form.company} onChange={e => update('company', e.target.value)}
              placeholder="TechCorp Inc"
              className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Location</label>
            <input type="text" value={form.location} onChange={e => update('location', e.target.value)}
              placeholder="San Francisco, CA"
              className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Salary Range</label>
            <input type="text" value={form.salary_range} onChange={e => update('salary_range', e.target.value)}
              placeholder="$120k - $180k"
              className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Remote Policy</label>
            <select value={form.remote_policy} onChange={e => update('remote_policy', e.target.value)}
              className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none">
              {REMOTE_OPTIONS.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Experience Level</label>
            <select value={form.experience_level} onChange={e => update('experience_level', e.target.value)}
              className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none">
              {['junior', 'mid', 'senior', 'lead', 'principal'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Job Description *</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)}
            rows={5} placeholder="Describe the role, responsibilities, and what you're looking for..."
            className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none resize-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Requirements (one per line)</label>
          <textarea value={form.requirements} onChange={e => update('requirements', e.target.value)}
            rows={4} placeholder="5+ years React experience&#10;Strong TypeScript skills&#10;Experience with cloud platforms"
            className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none resize-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Tech Stack (comma separated)</label>
          <input type="text" value={form.tech_stack} onChange={e => update('tech_stack', e.target.value)}
            placeholder="React, Node.js, PostgreSQL, AWS"
            className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Application Deadline</label>
          <input type="date" value={form.application_deadline} onChange={e => update('application_deadline', e.target.value)}
            className="w-full bg-surface-700 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Posting...</> : 'Post Job'}
        </button>
      </motion.form>
    </div>
  )
}

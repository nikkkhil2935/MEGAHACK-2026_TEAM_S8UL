import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map, Plus, BookOpen, Trophy, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function Roadmap() {
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [skill, setSkill] = useState('')
  const [level, setLevel] = useState('beginner')
  const [targetLevel, setTargetLevel] = useState('intermediate')
  const [weeklyHours, setWeeklyHours] = useState(10)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchRoadmaps() }, [])

  async function fetchRoadmaps() {
    try {
      const { data } = await api.get('/roadmap')
      setRoadmaps(data)
    } catch { toast.error('Failed to load roadmaps') }
    finally { setLoading(false) }
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!skill.trim()) return toast.error('Enter a skill name')
    setGenerating(true)
    try {
      const { data } = await api.post('/roadmap/generate', {
        skill: skill.trim(), candidate_level: level, target_level: targetLevel, weekly_hours: weeklyHours
      })
      toast.success(data.cached ? 'Roadmap loaded from cache' : 'Roadmap generated!')
      setShowForm(false)
      setSkill('')
      fetchRoadmaps()
    } catch { toast.error('Failed to generate roadmap') }
    finally { setGenerating(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-400" size={32} />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Learning Roadmaps</h1>
          <p className="text-sm text-gray-400 mt-1">AI-generated skill paths with YouTube courses & quizzes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
          <Plus size={16} /> New Roadmap
        </button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleGenerate}
          className="bg-surface-800 border border-white/5 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Skill to Learn</label>
              <input value={skill} onChange={e => setSkill(e.target.value)}
                placeholder="e.g. React, Python, System Design"
                className="w-full px-3 py-2 bg-surface-700 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Weekly Hours Available</label>
              <input type="number" value={weeklyHours} onChange={e => setWeeklyHours(+e.target.value)}
                min={1} max={40}
                className="w-full px-3 py-2 bg-surface-700 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Current Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)}
                className="w-full px-3 py-2 bg-surface-700 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Target Level</label>
              <select value={targetLevel} onChange={e => setTargetLevel(e.target.value)}
                className="w-full px-3 py-2 bg-surface-700 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500">
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
            {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Map size={16} /> Generate Roadmap</>}
          </button>
        </motion.form>
      )}

      {roadmaps.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Map size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No roadmaps yet</p>
          <p className="text-sm mt-1">Create your first AI-generated learning path</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmaps.map((rm, i) => (
            <motion.div key={rm.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <Link to={`/roadmap/${rm.id}`}
                className="block bg-surface-800 border border-white/5 hover:border-brand-500/30 rounded-xl p-5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                      <BookOpen size={20} className="text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{rm.skill_name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Week {rm.current_week} of 4</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-500" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <span>Progress</span>
                    <span>{rm.progress_percent || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${rm.progress_percent || 0}%` }} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

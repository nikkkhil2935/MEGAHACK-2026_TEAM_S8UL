import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Play, CheckCircle, ExternalLink, ChevronRight, ArrowLeft, Loader2, Trophy, Youtube } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import RoadmapTimeline from '../components/roadmap/RoadmapTimeline'

export default function RoadmapDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(null)

  useEffect(() => { fetchRoadmap() }, [id])

  async function fetchRoadmap() {
    try {
      const { data } = await api.get(`/roadmap/${id}`)
      setRoadmap(data)
    } catch { toast.error('Failed to load roadmap'); navigate('/roadmap') }
    finally { setLoading(false) }
  }

  async function markComplete(url, week) {
    setCompleting(url)
    try {
      const { data } = await api.post(`/roadmap/${id}/complete`, { resource_url: url, week })
      setRoadmap(prev => ({ ...prev, progress_percent: data.progress, completed_resources: [...(prev.completed_resources || []), { url }] }))
      toast.success('Resource completed!')
    } catch { toast.error('Failed to mark complete') }
    finally { setCompleting(null) }
  }

  async function advanceWeek() {
    try {
      const { data } = await api.post(`/roadmap/${id}/next-week`)
      setRoadmap(prev => ({ ...prev, current_week: data.current_week }))
      toast.success(`Advanced to Week ${data.current_week}`)
    } catch { toast.error('Failed to advance week') }
  }

  function isCompleted(url) {
    return (roadmap?.completed_resources || []).some(r => r.url === url)
  }

  function getCompletedWeeks() {
    const weeks = roadmap.path_data?.weeks || [];
    return weeks
      .map((w, i) => {
        const weekNum = i + 1;
        const allCompleted = (w.resources || []).every(r => isCompleted(r.url));
        return allCompleted ? weekNum : null;
      })
      .filter(Boolean);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-400" size={32} />
    </div>
  )

  if (!roadmap) return null

  const pathData = roadmap.path_data || {}
  const weeks = pathData.weeks || []
  const currentWeek = roadmap.current_week || 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <button onClick={() => navigate('/roadmap')}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-foreground mb-4 transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Back to Roadmaps
      </button>

      <div className="bg-surface-800 border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{roadmap.skill_name}</h1>
            <p className="text-sm text-gray-400 mt-1">{pathData.overview}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-400">{roadmap.progress_percent || 0}%</div>
            <div className="text-xs text-gray-500">Week {currentWeek}/4</div>
          </div>
        </div>
        <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${roadmap.progress_percent || 0}%` }} />
        </div>
      </div>

      {/* Timeline */}
      <RoadmapTimeline
        weeks={roadmap.total_weeks || weeks.length || 4}
        currentWeek={currentWeek}
        completedWeeks={getCompletedWeeks()}
        onWeekSelect={(week) => {
          if (week < currentWeek || getCompletedWeeks().includes(week)) {
            window.scrollTo(0, 0);
            // In a real app, this would navigate to that week
          }
        }}
      />

      {/* Weeks */}
      <div className="space-y-6">
        {weeks.map((week, wi) => {
          const isActive = week.week === currentWeek
          const isPast = week.week < currentWeek
          const isFuture = week.week > currentWeek

          return (
            <motion.div key={week.week} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wi * 0.1 }}
              className={`bg-surface-800 border rounded-xl p-6 ${isActive ? 'border-brand-500/40' : 'border-white/5'} ${isFuture ? 'opacity-60' : ''}`}>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isPast ? 'bg-green-500/20 text-green-400' : isActive ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-700 text-gray-500'}`}>
                    {isPast ? <CheckCircle size={16} /> : week.week}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{week.theme}</h3>
                    <p className="text-xs text-gray-400">{week.goal}</p>
                  </div>
                </div>
                {isActive && week.week < 4 && (
                  <button onClick={advanceWeek}
                    className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer">
                    Next Week <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {/* Topics */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(week.topics || []).map(t => (
                  <span key={t} className="px-2.5 py-1 bg-surface-700 rounded-full text-xs text-gray-300">{t}</span>
                ))}
              </div>

              {/* Resources */}
              <div className="space-y-2 mb-4">
                {(week.resources || []).map((r, ri) => (
                  <div key={ri} className="flex items-center justify-between bg-surface-700/50 rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.priority === 'essential' ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-600 text-gray-400'}`}>
                        {r.type}
                      </span>
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-foreground hover:text-brand-400 transition-colors flex items-center gap-1">
                        {r.title} <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{r.estimated_hours}h</span>
                      {!isCompleted(r.url) ? (
                        <button onClick={() => markComplete(r.url, week.week)}
                          disabled={completing === r.url || isFuture}
                          className="text-xs text-gray-400 hover:text-green-400 transition-colors cursor-pointer disabled:opacity-30">
                          {completing === r.url ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        </button>
                      ) : (
                        <CheckCircle size={14} className="text-green-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* YouTube Videos */}
              {week.youtube_videos?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                    <Youtube size={14} className="text-red-400" /> YouTube Resources
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {week.youtube_videos.map(v => (
                      <a key={v.video_id} href={v.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-surface-700/30 rounded-lg p-2.5 hover:bg-surface-700 transition-colors">
                        {v.thumbnail && <img src={v.thumbnail} alt="" className="w-20 h-12 rounded object-cover" />}
                        <div className="min-w-0">
                          <p className="text-xs text-foreground truncate">{v.title}</p>
                          <p className="text-[10px] text-gray-500">{v.channel}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini Project */}
              {week.mini_project && (
                <div className="bg-brand-500/5 border border-brand-500/10 rounded-lg px-4 py-3">
                  <div className="text-xs font-medium text-brand-400 mb-1">🛠️ Mini Project</div>
                  <p className="text-sm text-gray-300">{week.mini_project}</p>
                </div>
              )}

              {/* Quiz Button */}
              {isActive && (
                <button onClick={() => navigate(`/quiz?roadmap=${id}&week=${week.week}`)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-surface-700 hover:bg-surface-600 text-foreground rounded-lg text-sm transition-colors cursor-pointer">
                  <Trophy size={16} className="text-yellow-400" /> Take Week {week.week} Quiz
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Practice Projects & Interview Prep */}
      {(pathData.practice_projects?.length > 0 || pathData.interview_prep?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {pathData.practice_projects?.length > 0 && (
            <div className="bg-surface-800 border border-white/5 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Practice Projects</h3>
              <div className="space-y-3">
                {pathData.practice_projects.map((p, i) => (
                  <div key={i} className="bg-surface-700/50 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' : p.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {p.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pathData.interview_prep?.length > 0 && (
            <div className="bg-surface-800 border border-white/5 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Interview Prep</h3>
              <div className="space-y-2">
                {pathData.interview_prep.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-brand-400 font-bold mt-0.5">{i + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

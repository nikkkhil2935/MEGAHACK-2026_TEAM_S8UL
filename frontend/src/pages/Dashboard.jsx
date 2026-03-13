import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Briefcase, User, Search, Bell, History, ArrowRight, Play, MoreHorizontal, Calendar as CalendarIcon, CheckCircle2, Flame, Award, ChevronLeft, ChevronRight, Video } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/auth'
import { useGamificationStore } from '../store/gamification'
import XPProgressCard from '../components/gamification/XPProgressCard'
import BadgesDisplay from '../components/gamification/BadgesDisplay'
import GoogleCalendarWidget from '../components/dashboard/GoogleCalendarWidget'

export default function Dashboard() {
  const { user } = useAuthStore()
export default function Dashboard() {
  const { user } = useAuthStore()
  const getStats = useGamificationStore(s => s.getStats)
  const xp = useGamificationStore(s => s.xp)
  const gamStats = getStats()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Gamification states
  const { xp, totalXP, badges, streakDays, interviewsCompleted, quizzesCompleted, roadmapsStarted } = useGamificationStore()
  const gamStats = useMemo(() => useGamificationStore.getState().getStats(), [xp, totalXP, badges, streakDays, interviewsCompleted, quizzesCompleted, roadmapsStarted])

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/dashboard/candidate')
        setData(res.data)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const profileScore = data?.profile_strength || 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1 tracking-tight">
            Hey {user?.full_name?.split(' ')[0] || 'Candidate'},
          </h1>
          <p className="text-foreground-muted text-sm font-medium">
            It's sunny today and it's time to prepare 💪
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-brand-500/10 text-brand-600 dark:text-brand-400 px-4 py-2 rounded-xl font-bold text-sm">
            <Flame size={16} className="text-orange-500 mr-2" />
            {gamStats.streakDays || 0} Day Streak
          </div>
          <Link to="/interview" className="flex items-center gap-2 px-4 py-2 bg-foreground text-surface-900 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            <Video size={16} /> New Interview
          </Link>
        </div>
      </div>

      {/* Main Grid: Integrates Progress, Level, and Dashboard Widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Left Column: Progress & Core Stats (Span 2) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Top Row: My Level & Profile Strength */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Level & XP Card */}
            <div className="bg-surface-800 border border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Current Level</h2>
                <span className="text-2xl">{gamStats?.level?.emoji || '🌱'}</span>
              </div>
              <h3 className="text-2xl font-bold text-brand-500 dark:text-brand-400 mb-1">{gamStats?.level?.name || 'Fresher'}</h3>
              <p className="text-sm text-foreground-muted mb-4">{gamStats.xp} / {gamStats.totalXP} XP</p>
              <div className="w-full bg-surface-600 rounded-full h-2 mb-2">
                <div className="bg-brand-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.round((gamStats.xp / gamStats.totalXP) * 100)}%` }}></div>
              </div>
              <p className="text-right text-xs text-foreground-muted">{Math.round((gamStats.xp / gamStats.totalXP) * 100)}% to next level</p>
            </div>

            {/* Profile & Interviews Card */}
            <div className="bg-surface-800 border border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-2">
                   <h2 className="text-lg font-bold text-foreground">Profile Strength</h2>
                   <div className="w-10 h-10 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center">
                      <User size={20} />
                   </div>
                 </div>
                 <div className="flex items-end gap-2 mb-6">
                   <span className="text-4xl font-bold text-foreground">{Math.round(profileScore)}%</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-surface-900 border border-black/5 dark:border-white/5 rounded-2xl p-4">
                     <p className="text-xs text-foreground-muted mb-1">Interviews</p>
                     <p className="text-xl font-bold text-foreground">{data?.stats?.totalInterviews || 0}</p>
                   </div>
                   <div className="bg-surface-900 border border-black/5 dark:border-white/5 rounded-2xl p-4">
                     <p className="text-xs text-foreground-muted mb-1">Applications</p>
                     <p className="text-xl font-bold text-foreground">{data?.stats?.totalApplications || 0}</p>
                   </div>
                 </div>
               </div>
            </div>
            
          </div>

          {/* Bottom Row: Activity & Recommendations (Section 2 & 3 merged) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            
            {/* Recommendations */}
            <div className="bg-surface-800 border border-white/5 rounded-3xl p-6 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">Recommendations</h3>
                  <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full text-xs font-bold">{data?.profile_nudges?.length || 0}</span>
                </div>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-2">
                {(data?.profile_nudges || []).length > 0 ? (
                  data.profile_nudges.map((nudge, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-surface-900 border border-black/5 dark:border-white/5 hover:border-brand-500/30 transition-colors">
                      <div className="bg-orange-500/10 text-orange-500 p-2 rounded-lg shrink-0">
                         <Award size={16} />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-foreground mb-0.5">{nudge.type === 'missing_field' ? 'Profile Incomplete' : 'Update Profile'}</h4>
                         <p className="text-xs text-foreground-muted leading-relaxed">{nudge.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <CheckCircle2 size={32} className="mb-2" />
                    <p className="text-sm">All caught up!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-surface-800 border border-white/5 rounded-3xl p-6 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">Recent Activity</h3>
                  <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">{(data?.recent_interviews || []).length}</span>
                </div>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-2">
                {(data?.recent_interviews || []).length > 0 ? (
                  data.recent_interviews.map((interview, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-900 border border-black/5 dark:border-white/5 hover:border-blue-500/30 transition-colors">
                      <div className="bg-blue-500/10 text-blue-500 p-2 rounded-lg shrink-0">
                         <History size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{interview.job_title || interview.interview_type || 'Mock Interview'}</h4>
                        <p className="text-xs text-foreground-muted truncate">{interview.company || 'Practice'} • Score: {interview.score ?? interview.overall_score ?? '—'}</p>
                      </div>
                      <div className="text-xs text-foreground-muted shrink-0">
                        {interview.created_at ? new Date(interview.created_at).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <History size={32} className="mb-2" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Calendar & Badges */}
        <div className="flex flex-col gap-6">
          
          {/* Calendar Widget */}
          <div className="bg-surface-800 border border-white/5 rounded-3xl p-6 shadow-sm overflow-hidden">
             <GoogleCalendarWidget interviews={data?.recent_interviews || []} />
          </div>

          {/* Gamification Achievements */}
          <div className="bg-surface-800 border border-white/5 rounded-3xl p-6 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-foreground">Achievements ({gamStats.badges?.length || 0})</h4>
            </div>
            <BadgesDisplay badges={gamStats.badges} limit={6} compact={true} />
            {(!gamStats.badges || gamStats.badges.length === 0) && (
               <div className="text-center text-foreground-muted text-sm py-8 bg-surface-900 rounded-2xl border border-dashed border-white/10">
                 Complete tasks to earn badges!
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

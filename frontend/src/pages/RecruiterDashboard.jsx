import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, Users, Plus, Eye, ChevronRight, Loader2, Building2, Activity, Clock, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activityFeed, setActivityFeed] = useState([])

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const { data } = await api.get('/jobs/recruiter/my-jobs')
      setJobs(data || [])
    } catch {
      try {
        const { data } = await api.get('/jobs')
        setJobs(data || [])
      } catch { toast.error('Failed to load jobs') }
    }
    finally { setLoading(false) }
  }

  // Simulated activity feed
  useEffect(() => {
    if (jobs.length > 0) {
      const recentActivity = jobs
        .filter(j => j.applicant_count > 0)
        .slice(0, 5)
        .map(j => ({
          job_title: j.title,
          count: j.applicant_count,
          time: j.created_at
        }));
      setActivityFeed(recentActivity);
    }
  }, [jobs]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-400" size={32} />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1 tracking-tight">Recruiter Dashboard</h1>
          <p className="text-foreground-muted text-sm font-medium">Manage job postings and review candidates</p>
        </div>
        <Link to="/recruiter/post-job"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-foreground text-surface-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Post New Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Active Jobs', value: jobs.length, icon: Briefcase, color: 'brand' },
          { label: 'Total Applicants', value: jobs.reduce((s, j) => s + (j.applicant_count || 0), 0), icon: Users, color: 'accent' },
          { label: 'Avg Match Score', value: Math.round(jobs.reduce((s, j) => s + (j.avg_match || 0), 0) / (jobs.length || 1)) + '%', icon: Building2, color: 'brand' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-800 border border-white/5 rounded-3xl p-6 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className={`w-14 h-14 rounded-2xl bg-surface-900 border border-black/5 dark:border-white/5 flex items-center justify-center`}>
              <stat.icon size={24} className="text-foreground" />
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</div>
              <div className="text-sm font-medium text-foreground-muted">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (Job Listings) - Spans 2 cols */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-800 border border-white/5 rounded-3xl p-6 min-h-[400px]">
            <h3 className="font-bold text-foreground text-lg mb-6">Active Job Postings</h3>
            
            {jobs.length === 0 ? (
              <div className="text-center py-20 text-foreground-muted">
                <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No jobs posted yet</p>
                <p className="text-sm mt-1">Create your first job posting to start receiving candidates</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, i) => (
                  <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-surface-900 border border-black/5 dark:border-white/5 hover:border-brand-500/30 rounded-2xl p-5 transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground text-lg mb-1">{job.title}</h3>
                        <p className="text-sm font-medium text-foreground-muted mb-4">{job.company} {job.location ? `• ${job.location}` : ''}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {job.remote_policy && <span className="text-[11px] font-bold px-3 py-1 bg-surface-800 rounded-full text-foreground-muted capitalize border border-black/5 dark:border-white/5">{job.remote_policy}</span>}
                          {job.tech_stack?.slice(0, 4).map(t => (
                            <span key={t} className="text-[11px] font-bold px-3 py-1 bg-brand-500/10 rounded-full text-brand-600 dark:text-brand-400">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-2 border-t sm:border-t-0 sm:border-l border-surface-700 pt-4 sm:pt-0 sm:pl-6">
                        <div className="text-center sm:text-right">
                          <div className="text-2xl font-black text-foreground tracking-tight">{job.applicant_count || 0}</div>
                          <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Applicants</div>
                        </div>
                        <Link to={`/recruiter/job/${job.id}`} title="View applicants"
                          className="px-4 py-2 bg-foreground text-surface-900 hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold shadow-sm">
                          <UserPlus size={16} /> Review
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Activity Feed) */}
        <div>
          <div className="bg-surface-800 border border-white/5 rounded-3xl p-6 min-h-[400px]">
            <h3 className="font-bold text-foreground text-lg mb-6 flex items-center gap-2">
              <Activity size={18} className="text-blue-500" /> Recent Activity
            </h3>
            
            {activityFeed.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-600 before:to-transparent">
                {activityFeed.map((a, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-surface-800 bg-blue-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-inner z-10"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-surface-900 border border-black/5 dark:border-white/5 p-4 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-foreground text-sm">New Applicants</div>
                        <time className="font-medium text-xs text-foreground-muted">{new Date(a.time).toLocaleDateString()}</time>
                      </div>
                      <div className="text-xs font-medium text-foreground-muted">
                        <span className="text-brand-500 dark:text-brand-400 font-bold">+{a.count}</span> applied to {a.job_title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
                <Clock size={32} className="mb-2" />
                <p className="text-sm font-medium">No activity yet</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

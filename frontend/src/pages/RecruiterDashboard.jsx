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

  // Simulated activity feed from recent applications
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Recruiter Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Manage job postings and review candidates</p>
        </div>
        <Link to="/recruiter/post-job"
          className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Post New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Jobs', value: jobs.length, icon: Briefcase, color: 'brand' },
          { label: 'Total Applicants', value: jobs.reduce((s, j) => s + (j.applicant_count || 0), 0), icon: Users, color: 'accent' },
          { label: 'Avg Match Score', value: Math.round(jobs.reduce((s, j) => s + (j.avg_match || 0), 0) / (jobs.length || 1)) + '%', icon: Building2, color: 'green' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-800 border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon size={20} className={`text-${stat.color}-400`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      {activityFeed.length > 0 && (
        <div className="bg-surface-800 border border-white/5 rounded-xl p-4 mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity size={14} className="text-green-400" /> Recent Activity
          </h3>
          <div className="space-y-2">
            {activityFeed.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-gray-400">
                  <span className="text-foreground font-medium">{a.count}</span> applicant{a.count !== 1 ? 's' : ''} applied to <span className="text-foreground font-medium">{a.job_title}</span>
                </span>
                <span className="text-gray-500 ml-auto">{new Date(a.time).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Listings */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No jobs posted yet</p>
          <p className="text-sm mt-1">Create your first job posting to start receiving candidates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface-800 border border-white/5 hover:border-brand-500/30 rounded-xl p-5 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{job.title}</h3>
                  <p className="text-sm text-gray-400">{job.company} {job.location ? `• ${job.location}` : ''}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {job.remote_policy && <span className="text-xs px-2 py-0.5 bg-surface-700 rounded text-gray-400 capitalize">{job.remote_policy}</span>}
                    {job.tech_stack?.slice(0, 4).map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-brand-500/10 rounded text-brand-400">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{job.applicant_count || 0}</div>
                    <div className="text-[10px] text-gray-500">applicants</div>
                  </div>
                  <Link to={`/recruiter/job/${job.id}`} title="View applicants & invite"
                    className="p-2 bg-surface-700 hover:bg-surface-600 rounded-lg transition-colors flex items-center gap-1">
                    <UserPlus size={14} className="text-brand-400" />
                    <Eye size={16} className="text-gray-400" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, TrendingUp, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../services/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function RecruiterAnalytics() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/jobs/recruiter/my-jobs')
      .then(r => setJobs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicant_count || 0), 0)
  const avgMatch = jobs.length ? Math.round(jobs.reduce((sum, j) => sum + (j.avg_match || 0), 0) / jobs.length) : 0

  const applicantsPerJob = jobs.map(j => ({
    name: j.title?.substring(0, 20) || 'Job',
    applicants: j.applicant_count || 0,
  }))

  // Aggregate tech stack demand
  const techDemand = {}
  jobs.forEach(j => {
    (j.tech_stack || []).forEach(t => {
      techDemand[t] = (techDemand[t] || 0) + 1
    })
  })
  const techData = Object.entries(techDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/recruiter" className="text-gray-400 hover:text-foreground text-sm flex items-center gap-1 mb-6">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1 flex items-center gap-2">
            <BarChart3 size={24} className="text-brand-400" /> Recruiting Analytics
          </h1>
          <p className="text-sm text-gray-400 mb-8">Insights across all your job postings</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-5">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Total Jobs</div>
            <div className="text-3xl font-display font-bold text-brand-400">{jobs.length}</div>
          </div>
          <div className="glass-card p-5">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Total Applicants</div>
            <div className="text-3xl font-display font-bold text-green-400">{totalApplicants}</div>
          </div>
          <div className="glass-card p-5">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Active Jobs</div>
            <div className="text-3xl font-display font-bold text-accent-400">{jobs.filter(j => !j.application_deadline || new Date(j.application_deadline) > new Date()).length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Applications per Job */}
          {applicantsPerJob.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-foreground font-semibold text-sm mb-4 flex items-center gap-2">
                <Users size={14} className="text-brand-400" /> Applications per Job
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={applicantsPerJob}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-600)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-foreground-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--color-foreground-muted)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)', borderRadius: 8, color: 'var(--color-foreground)' }} />
                  <Bar dataKey="applicants" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tech Stack Demand */}
          {techData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-foreground font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-green-400" /> Tech Stack Demand
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={techData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={2}
                    label={({ name, value }) => `${name} (${value})`}>
                    {techData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-surface-600)', borderRadius: 8, color: 'var(--color-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Job Performance Table */}
        <div className="glass-card p-5">
          <h3 className="text-foreground font-semibold text-sm mb-4">Job Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                  <th className="pb-2 pr-4">Job Title</th>
                  <th className="pb-2 pr-4">Company</th>
                  <th className="pb-2 pr-4">Applicants</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pr-4 text-foreground font-medium">{j.title}</td>
                    <td className="py-2.5 pr-4 text-gray-400">{j.company}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`font-bold ${j.applicant_count > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                        {j.applicant_count || 0}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        !j.application_deadline || new Date(j.application_deadline) > new Date()
                          ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {!j.application_deadline || new Date(j.application_deadline) > new Date() ? 'Active' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

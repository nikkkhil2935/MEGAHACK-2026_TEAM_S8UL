import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Briefcase } from 'lucide-react'
import api from '../services/api'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/jobs', { params: { search: search || undefined } })
      .then(r => setJobs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  const scoreColor = (s) => s >= 75 ? 'bg-green-500/20 text-green-300 border-green-500/30' :
    s >= 50 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Browse Jobs</h1>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-3.5 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-10" placeholder="Search by job title..." />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Briefcase size={32} className="text-gray-600 mx-auto mb-3" />
            <h3 className="text-foreground font-semibold mb-1">No Jobs Found</h3>
            <p className="text-gray-400 text-sm">Check back later or try a different search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job, i) => (
              <motion.div key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Link to={`/jobs/${job.id}`}
                  className="glass-card p-5 block hover:border-brand-500/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-foreground font-semibold">{job.title}</h3>
                      <p className="text-gray-400 text-sm">{job.company}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {job.location && <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>}
                        <span className="capitalize">{job.remote_policy}</span>
                        {job.job_category && <span className="px-2 py-0.5 bg-surface-700 rounded">{job.job_category}</span>}
                      </div>
                    </div>
                    {job.match_score !== undefined && (
                      <div className={`px-3 py-1 rounded-full text-sm font-bold border ${scoreColor(job.match_score)}`}>
                        {job.match_score}%
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

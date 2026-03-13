import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Briefcase } from 'lucide-react'
import api from '../services/api'

const FALLBACK_JOBS = [
  { id: 'mock-1', title: 'Senior React Developer', company: 'TechVista Solutions', location: 'Bangalore, India', remote_policy: 'hybrid', job_category: 'Frontend', match_score: 92 },
  { id: 'mock-2', title: 'Backend Engineer (Node.js)', company: 'CloudNine Systems', location: 'Mumbai, India', remote_policy: 'remote', job_category: 'Backend', match_score: 85 },
  { id: 'mock-3', title: 'Data Scientist', company: 'AnalytiQ Labs', location: 'Hyderabad, India', remote_policy: 'onsite', job_category: 'Data Science', match_score: 78 },
  { id: 'mock-4', title: 'Full Stack Developer (MERN)', company: 'StartupHub Inc.', location: 'Pune, India', remote_policy: 'remote', job_category: 'Full Stack', match_score: 88 },
  { id: 'mock-5', title: 'DevOps Engineer', company: 'InfraScale Technologies', location: 'Chennai, India', remote_policy: 'hybrid', job_category: 'DevOps', match_score: 71 },
  { id: 'mock-6', title: 'ML Engineer', company: 'NeuralPath AI', location: 'Bangalore, India', remote_policy: 'remote', job_category: 'AI/ML', match_score: 82 },
  { id: 'mock-7', title: 'Product Manager', company: 'GrowthForge', location: 'Delhi NCR, India', remote_policy: 'hybrid', job_category: 'Product', match_score: 65 },
  { id: 'mock-8', title: 'Mobile Developer (React Native)', company: 'AppCraft Studios', location: 'Gurgaon, India', remote_policy: 'onsite', job_category: 'Mobile', match_score: 76 },
  { id: 'mock-9', title: 'Cloud Architect', company: 'SkyBridge Cloud', location: 'Noida, India', remote_policy: 'remote', job_category: 'Cloud', match_score: 69 },
  { id: 'mock-10', title: 'UI/UX Designer', company: 'PixelPerfect Design', location: 'Mumbai, India', remote_policy: 'hybrid', job_category: 'Design', match_score: 74 },
  { id: 'mock-11', title: 'Data Engineer', company: 'DataFlow Systems', location: 'Pune, India', remote_policy: 'hybrid', job_category: 'Data Science', match_score: 80 },
  { id: 'mock-12', title: 'Cybersecurity Analyst', company: 'SecureNet', location: 'Bangalore, India', remote_policy: 'onsite', job_category: 'Security', match_score: 95 },
  { id: 'mock-13', title: 'Game Developer (Unity)', company: 'PlayVibe Studios', location: 'Hyderabad, India', remote_policy: 'remote', job_category: 'Gaming', match_score: 60 },
  { id: 'mock-14', title: 'Scrum Master', company: 'AgileMinds', location: 'Chennai, India', remote_policy: 'hybrid', job_category: 'Management', match_score: 75 },
  { id: 'mock-15', title: 'Blockchain Developer', company: 'CryptoCore', location: 'Mumbai, India', remote_policy: 'remote', job_category: 'Blockchain', match_score: 87 },
  { id: 'mock-16', title: 'AR/VR Developer', company: 'Visionary Tech', location: 'Pune, India', remote_policy: 'onsite', job_category: 'AR/VR', match_score: 68 },
  { id: 'mock-17', title: 'Embedded Systems Engineer', company: 'Hardware Inc.', location: 'Bangalore, India', remote_policy: 'hybrid', job_category: 'Hardware', match_score: 81 },
  { id: 'mock-18', title: 'Big Data Architect', company: 'MassiveData', location: 'Gurgaon, India', remote_policy: 'remote', job_category: 'Data Science', match_score: 72 },
  { id: 'mock-19', title: 'QA Automation Engineer', company: 'Testify', location: 'Noida, India', remote_policy: 'hybrid', job_category: 'QA', match_score: 89 },
  { id: 'mock-20', title: 'Technical Writer', company: 'DocuTech', location: 'Remote', remote_policy: 'remote', job_category: 'Documentation', match_score: 91 },
  { id: 'mock-21', title: 'Go Developer', company: 'FastScale', location: 'Bangalore, India', remote_policy: 'remote', job_category: 'Backend', match_score: 83 },
  { id: 'mock-22', title: 'Salesforce Developer', company: 'CloudCRM CRM', location: 'Hyderabad, India', remote_policy: 'hybrid', job_category: 'CRM', match_score: 64 },
  { id: 'mock-23', title: 'Kotlin Developer', company: 'MicroServices LLC', location: 'Pune, India', remote_policy: 'remote', job_category: 'Backend', match_score: 77 },
  { id: 'mock-24', title: 'IOS Engineer (Swift)', company: 'AppleTree', location: 'Chennai, India', remote_policy: 'onsite', job_category: 'Mobile', match_score: 86 },
  { id: 'mock-25', title: 'Penetration Tester', company: 'RedTeamSec', location: 'Mumbai, India', remote_policy: 'remote', job_category: 'Security', match_score: 93 },
]

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/jobs', { params: { search: search || undefined } })
      .then(r => {
        const data = r.data || []
        if (data.length > 0) {
          setJobs(data)
          setUsingFallback(false)
        } else {
          setJobs(FALLBACK_JOBS)
          setUsingFallback(true)
        }
      })
      .catch(() => {
        setJobs(FALLBACK_JOBS)
        setUsingFallback(true)
      })
      .finally(() => setLoading(false))
  }, [search])

  const displayJobs = usingFallback && search
    ? jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()))
    : jobs

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

        {usingFallback && (
          <div className="text-xs text-center text-gray-500 mb-4 bg-surface-800 border border-white/5 rounded-xl py-2.5">
            Showing sample jobs. Post a job as a recruiter to see real listings.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Briefcase size={32} className="text-gray-600 mx-auto mb-3" />
            <h3 className="text-foreground font-semibold mb-1">No Jobs Found</h3>
            <p className="text-gray-400 text-sm">Check back later or try a different search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayJobs.map((job, i) => (
              <motion.div key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Link to={job.id.startsWith('mock-') ? '#' : `/jobs/${job.id}`}
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

import { useState, useEffect } from 'react'
import { Github, Star, GitFork, ExternalLink, Trophy, AlertCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useGamificationStore } from '../store/gamification'

const COMPLEXITY_COLORS = {
  Beginner: 'text-green-500',
  Intermediate: 'text-yellow-500',
  Advanced: 'text-red-400',
  Expert: 'text-purple-400'
}

export default function GitHubAnalyzer() {
  const [username, setUsername] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [githubUsername, setGithubUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [merging, setMerging] = useState(false)
  const [activeRepo, setActiveRepo] = useState(null)
  const { awardXP } = useGamificationStore()

  useEffect(() => {
    api.get('/github/latest')
      .then(({ data }) => {
        if (data.analysis) {
          setAnalysis(data.analysis)
          setGithubUsername(data.githubUsername)
        }
      })
      .catch(() => {})
  }, [])

  const handleAnalyze = async () => {
    if (!username.trim()) return toast.error('Enter a GitHub username')
    setLoading(true)
    try {
      const { data } = await api.post('/github/analyze', { githubUsername: username.trim() })
      setAnalysis(data.analysis)
      setGithubUsername(data.githubUsername)
      toast.success('GitHub portfolio analyzed!')
      awardXP(30, 'GitHub Profile Analyzed 🚀')
    } catch (err) {
      const msg = err.response?.data?.error || 'Analysis failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleMergeProjects = async () => {
    setMerging(true)
    try {
      const { data } = await api.post('/github/merge-projects')
      toast.success(`✅ ${data.totalProjects} projects merged into your profile!`)
      awardXP(20, 'Synced GitHub Projects 🔄')
    } catch {
      toast.error('Merge failed')
    } finally {
      setMerging(false)
    }
  }

  const ScoreRing = ({ score }) => {
    const value = Number.isFinite(score) ? score : 0
    const color = value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444'
    const r = 36
    const circ = 2 * Math.PI * r
    const dash = (value / 100) * circ
    return (
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="currentColor" strokeWidth="8" opacity="0.1" />
        <circle
          cx="45" cy="45" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
        <text x="45" y="49" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>
          {value}
        </text>
      </svg>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Github className="w-8 h-8" /> GitHub Project Analyzer
        </h1>
        <p className="text-foreground/60 mt-1">
          AI-powered analysis of your GitHub portfolio. Get scored, get feedback, get hired.
        </p>
      </div>

      {/* Input */}
      <div className="glass-card p-6">
        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            placeholder="Enter GitHub username (e.g., torvalds)"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          />
          <button className="btn-primary px-6" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {githubUsername && (
          <p className="text-xs text-foreground/50 mt-2">
            Last analyzed: <strong>@{githubUsername}</strong>
          </p>
        )}
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* Portfolio Score */}
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-around gap-6">
              <div className="text-center">
                <ScoreRing score={analysis.portfolioScore} />
                <p className="text-sm font-semibold text-foreground mt-1">Portfolio Score</p>
              </div>
              <div className="text-center">
                <ScoreRing score={analysis.profileCompleteness} />
                <p className="text-sm font-semibold text-foreground mt-1">Profile Completeness</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-foreground/60" />
                  <span className="text-sm text-foreground">
                    {analysis.totalPublicRepos} public repos
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(analysis.languageDiversity || []).map(lang => (
                    <span
                      key={lang}
                      className="px-2 py-0.5 bg-surface-700 rounded text-xs text-foreground/80"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleMergeProjects}
                disabled={merging}
              >
                {merging ? 'Merging...' : '🔗 Merge into Profile'}
              </button>
            </div>
          </div>

          {/* Best repo highlight */}
          {analysis.bestRepoToHighlight && (
            <div className="glass-card p-5 border border-foreground/20 flex items-start gap-3">
              <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">
                  ⭐ Best Repo to Highlight: <code className="text-sm">{analysis.bestRepoToHighlight}</code>
                </p>
                <p className="text-sm text-foreground/70 mt-1">{analysis.bestRepoReason}</p>
              </div>
            </div>
          )}

          {/* Repository Cards */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Repository Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(analysis.repositories || []).map((repo, i) => (
                <div
                  key={i}
                  className={`glass-card p-4 cursor-pointer transition-all border-2
                    ${activeRepo?.name === repo.name ? 'border-foreground' : 'border-transparent'}`}
                  onClick={() => setActiveRepo(activeRepo?.name === repo.name ? null : repo)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        {repo.name}
                        {repo.resumeWorthy && (
                          <span className="text-xs px-1.5 py-0.5 bg-foreground text-surface-900 rounded ml-1">
                            Resume ✓
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          COMPLEXITY_COLORS[repo.complexity] || 'text-foreground/60'
                        }`}
                      >
                        {repo.complexity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">{repo.score}</p>
                      <p className="text-xs text-foreground/50">Score</p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-foreground/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" /> {repo.stars || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3" /> {repo.forks || 0}
                    </span>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  </div>

                  {/* Expanded detail */}
                  {activeRepo?.name === repo.name && (
                    <div className="mt-3 pt-3 border-t border-foreground/10 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-green-400 mb-1">✅ Highlights</p>
                        <ul className="space-y-0.5">
                          {(repo.highlights || []).map((h, j) => (
                            <li key={j} className="text-xs text-foreground/70">
                              • {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-yellow-400 mb-1">⚠️ Weaknesses</p>
                        <ul className="space-y-0.5">
                          {(repo.weaknesses || []).map((w, j) => (
                            <li key={j} className="text-xs text-foreground/70">
                              • {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-2 bg-surface-700 rounded">
                        <p className="text-xs font-semibold text-foreground mb-1">
                          📝 Improved Resume Description
                        </p>
                        <p className="text-xs text-foreground/70">{repo.improvedDescription}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" /> Portfolio Gaps
              </h3>
              <ul className="space-y-2">
                {(analysis.portfolioGaps || []).map((gap, i) => (
                  <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">◆</span> {gap}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Top Recommendations
              </h3>
              <ol className="space-y-2">
                {(analysis.topRecommendations || []).map((rec, i) => (
                  <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="font-bold text-foreground">{i + 1}.</span> {rec}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


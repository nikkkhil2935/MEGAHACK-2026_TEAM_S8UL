import { useState, useEffect } from 'react'
import { Github, Star, GitFork, ExternalLink, Trophy, AlertCircle, Zap, CheckCircle, XCircle, Shield, Cpu, Sparkles } from 'lucide-react'
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
  const [modelPrediction, setModelPrediction] = useState(null)
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
      setModelPrediction(data.modelPrediction || null)
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

      {(analysis || modelPrediction) && (
        <div className="space-y-6">
          {/* Dual Model Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-6 border-2 border-blue-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                  Our ML Model
                </span>
              </div>
              {modelPrediction ? (
                <div className="text-center space-y-3">
                  <ScoreRing score={Math.round(modelPrediction.projectQualityScore)} />
                  <p className="text-sm font-semibold text-foreground">Project Quality Score</p>
                  <div className="text-left space-y-1 text-xs text-foreground/50 mt-2">
                    <p>Total Stars: {modelPrediction.features_used?.stars}</p>
                    <p>Total Forks: {modelPrediction.features_used?.forks}</p>
                    <p>Commits analyzed: {modelPrediction.features_used?.commits}</p>
                    <p>Open Issues: {modelPrediction.features_used?.issues}</p>
                    <p>Avg README length: {modelPrediction.features_used?.readme_length} chars</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground/40 italic">ML model unavailable</p>
              )}
            </div>
            <div className="glass-card p-6 border-2 border-purple-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                  Groq AI Analysis
                </span>
              </div>
              {analysis ? (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-around">
                    <div>
                      <ScoreRing score={analysis.portfolioScore} />
                      <p className="text-xs font-semibold mt-1">Portfolio Score</p>
                    </div>
                    <div>
                      <ScoreRing score={analysis.profileCompleteness} />
                      <p className="text-xs font-semibold mt-1">Completeness</p>
                    </div>
                  </div>
                  <div className="text-left space-y-1 text-xs text-foreground/50 mt-2">
                    <p>Public repos: {analysis.totalPublicRepos}</p>
                    <p>Languages: {(analysis.languageDiversity || []).join(', ')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground/40 italic">AI analysis unavailable</p>
              )}
            </div>
          </div>

          {/* Merge + Language Tags */}
          {analysis && (
            <div className="glass-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
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
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={handleMergeProjects}
                  disabled={merging}
                >
                  {merging ? 'Merging...' : '🔗 Merge into Profile'}
                </button>
              </div>
            </div>
          )}

          {/* Best repo highlight */}
          {analysis?.bestRepoToHighlight && (
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

          {/* GitHub Verified Skills */}
          {analysis?.verifiedSkills?.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" /> GitHub Verified Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysis.verifiedSkills.map((vs, i) => (
                  <div
                    key={i}
                    className={`group relative px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 cursor-default transition-all ${
                      vs.verified
                        ? 'bg-green-500/10 text-green-300 border-green-500/30'
                        : 'bg-surface-700 text-foreground/50 border-white/5'
                    }`}
                  >
                    {vs.verified ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-foreground/30" />
                    )}
                    {vs.skill}
                    {vs.verified && vs.proficiencyLevel && vs.proficiencyLevel !== 'unknown' && (
                      <span className="text-[10px] uppercase tracking-wider text-green-500/70 ml-1">
                        {vs.proficiencyLevel}
                      </span>
                    )}
                    {vs.verified && vs.evidence && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-xs text-foreground/80 max-w-[220px] whitespace-normal shadow-xl">
                          {vs.evidence}
                          {vs.repos?.length > 0 && (
                            <div className="mt-1 text-foreground/50">
                              Repos: {vs.repos.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-foreground/40 mt-3">
                Skills verified against code, READMEs, and topics in your GitHub repositories.
              </p>
            </div>
          )}

          {/* Repository Cards */}
          {analysis && (
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
          )}

          {/* Portfolio Gaps */}
          {analysis && (
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
          )}
        </div>
      )}
    </div>
  )
}


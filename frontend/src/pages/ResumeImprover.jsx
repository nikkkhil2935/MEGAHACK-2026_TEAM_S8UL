import { useState, useEffect } from 'react'
import { FileText, CheckCircle, AlertCircle, AlertTriangle, Copy, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useGamificationStore } from '../store/gamification'

const SEVERITY_STYLES = {
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  moderate: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  low: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' }
}

export default function ResumeImprover() {
  const [jd, setJd] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const { awardXP } = useGamificationStore()

  useEffect(() => {
    api.get('/resume-improver/latest')
      .then(({ data }) => {
        if (data.analysis) setAnalysis(data.analysis)
      })
      .catch(() => {})
  }, [])

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/resume-improver/analyze', { jobDescription: jd })
      setAnalysis(data.analysis)
      toast.success('Resume analysis complete!')
      awardXP(30, 'Improved your Resume 📄')
    } catch (err) {
      const msg = err.response?.data?.error || 'Analysis failed. Make sure your profile is complete.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const ScoreGauge = ({ score, label }) => {
    const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'
    return (
      <div className="text-center">
        <p className={`text-2xl font-bold ${color}`}>{score}</p>
        <p className="text-xs text-foreground/60">{label}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-8 h-8" /> AI Resume Improver
        </h1>
        <p className="text-foreground/60 mt-1">
          Get expert-level improvements, ATS optimization, and before/after rewrites.
        </p>
      </div>

      {/* Setup */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Optional: Paste Job Description</h2>
        <textarea
          className="input-field w-full h-28 resize-none text-sm"
          placeholder="Paste the job description here to get role-tailored improvements and ATS keyword matching..."
          value={jd}
          onChange={e => setJd(e.target.value)}
        />
        <button className="btn-primary w-full py-3" onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing your resume...' : '🔍 Analyze & Improve My Resume'}
        </button>
      </div>

      {analysis && (
        <>
          {/* Scores overview */}
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-around gap-4">
              <ScoreGauge score={analysis.overallScore} label="Overall Score" />
              <ScoreGauge score={analysis.atsScore} label="ATS Score" />
              {Object.entries(analysis.sectionScores || {}).map(([k, v]) => (
                <ScoreGauge key={k} score={v} label={k.charAt(0).toUpperCase() + k.slice(1)} />
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {['overview', 'issues', 'rewrites', 'ats', 'quickwins'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
              >
                {{
                  overview: '📊 Overview',
                  issues: '⚠️ Issues',
                  rewrites: '✏️ Rewrites',
                  ats: '🤖 ATS Analysis',
                  quickwins: '⚡ Quick Wins'
                }[tab]}
              </button>
            ))}
          </div>

          {/* Tab: Issues */}
          {activeTab === 'issues' && (
            <div className="space-y-3">
              {(analysis.issues || []).map((issue, i) => {
                const { icon: Icon, color, bg } = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.moderate
                return (
                  <div key={i} className={`glass-card p-4 ${bg} border border-foreground/10`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />
                      <div>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          [{issue.severity}] {issue.section} — {issue.issue}
                        </p>
                        <p className="text-sm text-foreground/70 mt-1">💡 {issue.fix}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tab: Overview — Improved Summary */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-foreground">✨ Improved Summary</h3>
                  <button
                    onClick={() => copyText(analysis.improvedSummary)}
                    className="btn-ghost px-2 py-1 text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {analysis.improvedSummary}
                </p>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold text-foreground mb-3">🎯 Recommended Skills to Add</h3>
                <div className="flex flex-wrap gap-2">
                  {(analysis.skillsToAdd || []).map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 border border-foreground/30 rounded-full text-sm text-foreground/80"
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Rewrites */}
          {activeTab === 'rewrites' && (
            <div className="space-y-4">
              {(analysis.experienceImprovements || []).map((item, i) => (
                <div key={i} className="glass-card p-5 space-y-3">
                  <p className="text-xs text-foreground/50 font-semibold uppercase">{item.company}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <p className="text-xs font-semibold text-red-400 mb-1">❌ Before</p>
                      <p className="text-sm text-foreground/70">{item.original}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-xs font-semibold text-green-400 mb-1">✅ After</p>
                      <p className="text-sm text-foreground/80">{item.improved}</p>
                      <button
                        onClick={() => copyText(item.improved)}
                        className="mt-2 text-xs text-foreground/50 hover:text-foreground flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy improved
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: ATS */}
          {activeTab === 'ats' && (
            <div className="space-y-4">
              <div className="glass-card p-5">
                <h3 className="font-semibold text-foreground mb-3">🔴 Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {(analysis.missingKeywords || []).map(kw => (
                    <span
                      key={kw}
                      className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-sm text-red-400"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold text-foreground mb-3">⚠️ ATS Issues</h3>
                <ul className="space-y-2">
                  {(analysis.atsIssues || []).map((issue, i) => (
                    <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                      <span>•</span> {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab: Quick Wins */}
          {activeTab === 'quickwins' && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Quick Wins — Do These First
              </h3>
              <ol className="space-y-3">
                {(analysis.quickWins || []).map((win, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground text-surface-900 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground/80">{win}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  )
}


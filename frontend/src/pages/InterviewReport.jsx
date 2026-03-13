import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts'
import { CheckCircle, XCircle, AlertTriangle, Clock, Shield, TrendingUp, Users } from 'lucide-react'
import api from '../services/api'

const PANELISTS = {
  alex: { name: 'Alex Chen', role: 'Technical Lead', color: '#0fa8a8' },
  sarah: { name: 'Sarah Miller', role: 'HR Manager', color: '#a855f7' },
  david: { name: 'David Park', role: 'Behavioral Analyst', color: '#f59e0b' },
}

export default function InterviewReport() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    api.get(`/interview/report/${id}`).then(r => setSession(r.data))
  }, [id])

  if (!session) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const report = session.report || {}
  const scoreColor = (s) => s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'

  const radarData = report.score_breakdown
    ? Object.entries(report.score_breakdown).map(([k, v]) => ({
        subject: k.replace(/_/g, ' ').toUpperCase(), A: v
      }))
    : []

  const perQScores = (session.answers || []).map((a, i) => ({
    name: `Q${i + 1}`,
    score: (a.evaluation?.overall_score || 0) * 10,
  }))

  const hireColors = {
    'Strong Yes': 'bg-green-500/20 text-green-300 border-green-500/40',
    'Yes': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    'Maybe': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    'No': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    'Strong No': 'bg-red-500/20 text-red-300 border-red-500/40',
  }

  return (
    <div className="min-h-screen bg-surface-900 text-foreground">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Interview Report</h1>
              <p className="text-gray-400 mt-1">
                {session.job_postings?.company} &middot; {session.job_postings?.title || session.interview_type} &middot;{' '}
                {new Date(session.started_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl sm:text-6xl font-display font-bold ${scoreColor(report.overall_score)}`}>{report.overall_score}</div>
              <div className="text-gray-500 text-sm">/ 100</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border ${hireColors[report.hire_recommendation] || hireColors['Maybe']}`}>
              {report.hire_recommendation}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-700 border border-white/10">
              <Shield size={14} className={session.integrity_score >= 80 ? 'text-green-400' : 'text-red-400'} />
              Integrity: {session.integrity_score || 100}/100
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-700 border border-white/10">
              <Clock size={14} className="text-gray-400" />
              {Math.round((session.duration_seconds || 0) / 60)} min
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-700 border border-white/10">
              <TrendingUp size={14} className="text-brand-400" />
              {report.estimated_readiness}
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-800 rounded-xl mb-6">
          {['overview', ...(session.panel_mode ? ['panel'] : []), 'questions', 'replay', 'integrity'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer ${
                activeTab === tab ? 'bg-surface-700 text-foreground shadow' : 'text-gray-400 hover:text-gray-200'
              }`}>
              {tab === 'panel' ? 'Panel' : tab}
            </button>
          ))}
        </div>

        {/* PANEL */}
        {activeTab === 'panel' && session.panel_mode && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(report.panelist_verdicts || []).map((pv, i) => {
                const panelist = PANELISTS[pv.panelist_id] || {}
                return (
                  <div key={i} className="glass-card p-5 border-t-2" style={{ borderTopColor: panelist.color || '#666' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: panelist.color || '#666' }}>
                        {(pv.panelist_name || 'P')[0]}
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">{pv.panelist_name}</p>
                        <p className="text-gray-500 text-xs">{pv.role}</p>
                      </div>
                    </div>
                    <div className={`text-3xl font-display font-bold mb-2 ${scoreColor(pv.score)}`}>{pv.score}<span className="text-base font-normal text-gray-600">/100</span></div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                      pv.verdict === 'Yes' ? 'bg-green-500/20 text-green-300' : pv.verdict === 'No' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>{pv.verdict}</span>
                    <p className="text-sm text-gray-300 leading-relaxed">{pv.summary}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 text-gray-300">Score Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1f2937" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Radar dataKey="A" stroke="#0fa8a8" fill="#0fa8a8" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 text-gray-300">Per-Question Scores</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={perQScores}>
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="score" fill="#0fa8a8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Communication Radar */}
            {report?.score_breakdown && (
              <div className="glass-card p-5">
                <h3 className="text-foreground font-semibold text-sm mb-4">Performance Radar</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={[
                    { subject: 'Technical', value: report.score_breakdown.technical || 0 },
                    { subject: 'Behavioral', value: report.score_breakdown.behavioral || 0 },
                    { subject: 'Communication', value: report.score_breakdown.communication || 0 },
                    { subject: 'Problem Solving', value: report.score_breakdown.problem_solving || 0 },
                    { subject: 'Culture Fit', value: report.score_breakdown.culture_fit || 0 },
                  ]}>
                    <PolarGrid stroke="var(--color-surface-600)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-foreground-muted)', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar name="Score" dataKey="value" stroke="var(--color-brand-500)" fill="var(--color-brand-500)" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2"><CheckCircle size={16} /> Strengths</h3>
                <ul className="space-y-2">
                  {report.strengths?.map((s, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-green-500 shrink-0">&bull;</span> {s}</li>
                  ))}
                </ul>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2"><XCircle size={16} /> Areas to Improve</h3>
                <ul className="space-y-2">
                  {report.areas_to_improve?.map((s, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-red-500 shrink-0">&bull;</span> {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold mb-2">Hire Reasoning</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{report.hire_reasoning}</p>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-2">Overall Feedback</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{report.overall_feedback}</p>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">Next Steps</h3>
              <ol className="space-y-2">
                {report.next_steps?.map((s, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-3">
                    <span className="shrink-0 w-5 h-5 bg-brand-500/20 text-brand-300 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        {activeTab === 'questions' && (
          <div className="space-y-4 animate-fade-in">
            {session.questions?.map((q, i) => {
              const a = session.answers?.[i]
              const score = a?.evaluation?.overall_score || 0
              const panelist = q.panelist ? PANELISTS[q.panelist] : null
              return (
                <div key={i} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold bg-surface-700 text-gray-400 px-2 py-0.5 rounded">Q{i + 1}</span>
                        <span className="text-xs text-gray-500 capitalize">{q.type} &middot; {q.difficulty}</span>
                        {panelist && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${panelist.color}20`, color: panelist.color }}>
                            {panelist.name}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground font-medium text-sm">{q.question}</p>
                    </div>
                    <div className={`text-3xl font-display font-bold shrink-0 ${scoreColor(score * 10)}`}>
                      {score}<span className="text-base font-normal text-gray-600">/10</span>
                    </div>
                  </div>
                  {a?.transcript && (
                    <div className="bg-surface-700 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1">Your answer:</p>
                      <p className="text-gray-300 text-sm italic">&ldquo;{a.transcript}&rdquo;</p>
                    </div>
                  )}
                  {a?.evaluation?.feedback && <p className="text-sm text-blue-300 mb-2">{a.evaluation.feedback}</p>}
                  {a?.evaluation?.model_answer_summary && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">View model answer summary</summary>
                      <p className="text-sm text-green-300 mt-2 p-3 bg-green-500/10 rounded-lg">{a.evaluation.model_answer_summary}</p>
                    </details>
                  )}
                  {a?.followup_asked && (
                    <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-yellow-400 mb-1">Cross-examination question asked:</p>
                      <p className="text-sm text-gray-300">{a.followup_asked}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* REPLAY */}
        {activeTab === 'replay' && (
          <div className="glass-card p-6 animate-fade-in">
            <h2 className="font-semibold mb-6 text-gray-300">Interview Timeline</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-600" />
              <div className="space-y-6">
                {session.answers?.map((a, i) => {
                  const s = a.evaluation?.overall_score || 0
                  const col = s >= 7 ? 'bg-green-500' : s >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                  return (
                    <div key={i} className="flex gap-5 relative pl-12">
                      <div className={`absolute left-2 w-5 h-5 rounded-full ${col} flex items-center justify-center text-xs font-bold text-white shrink-0`}>{i + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">{session.questions[i]?.question}</p>
                          <span className={`text-sm font-bold ${scoreColor(s * 10)}`}>{s}/10</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{new Date(a.timestamp).toLocaleTimeString()}</p>
                        <p className="text-sm text-gray-400 italic">&ldquo;{a.transcript?.slice(0, 160)}{a.transcript?.length > 160 ? '...' : ''}&rdquo;</p>
                        {a.followup_asked && (
                          <p className="text-xs text-yellow-400 mt-1.5 flex items-center gap-1"><AlertTriangle size={11} /> Cross-examined</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* INTEGRITY */}
        {activeTab === 'integrity' && (
          <div className="space-y-5 animate-fade-in">
            <div className="glass-card p-6 text-center">
              <Shield size={40} className={`mx-auto mb-3 ${session.integrity_score >= 80 ? 'text-green-400' : session.integrity_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`} />
              <div className={`text-6xl font-display font-bold mb-2 ${scoreColor(session.integrity_score)}`}>{session.integrity_score || 100}</div>
              <p className="text-gray-400">Integrity Score / 100</p>
              <p className="text-sm text-gray-500 mt-1">
                {session.integrity_score >= 90 ? 'Excellent — No integrity violations detected'
                  : session.integrity_score >= 70 ? 'Good — Minor violations detected'
                  : 'Poor — Multiple violations detected'}
              </p>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4">Detected Events</h3>
              {(session.integrity_events || []).length === 0 ? (
                <p className="text-green-400 text-sm flex items-center gap-2"><CheckCircle size={16} /> No integrity events detected</p>
              ) : (
                <div className="space-y-2">
                  {session.integrity_events.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-surface-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span className="text-sm text-gray-300 capitalize">{e.type.replace('_', ' ')}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(e.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Link to="/interview" className="btn-primary flex-1 text-center">Take Another Interview</Link>
          <Link to="/dashboard" className="btn-ghost flex-1 text-center">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}

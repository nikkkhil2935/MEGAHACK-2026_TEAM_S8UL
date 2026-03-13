import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Star, Brain, Play, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useGamificationStore } from '../store/gamification'

// Landing page shown when no roadmap param
function QuizLanding() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [roadmaps, setRoadmaps] = useState([])
  const [recentAttempts, setRecentAttempts] = useState([])

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data } = await api.get('/quiz/dashboard')
        setRoadmaps(data.roadmaps || [])
        setRecentAttempts(data.recent_attempts || [])
      } catch {
        toast.error('Failed to load quizzes')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-400" size={32} />
      <span className="ml-3 text-gray-400">Loading quizzes...</span>
    </div>
  )

  if (roadmaps.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <Brain size={48} className="mx-auto mb-4 text-gray-500" />
      <h1 className="text-2xl font-display font-bold text-foreground mb-3">No Quizzes Available</h1>
      <p className="text-gray-400 mb-6">Create a learning roadmap first to unlock weekly quizzes.</p>
      <button onClick={() => navigate('/roadmap')}
        className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer">
        Create a Roadmap
      </button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold text-foreground mb-2">Quizzes</h1>
      <p className="text-gray-400 text-sm mb-8">Test your knowledge with AI-generated quizzes from your learning roadmaps.</p>

      {/* Roadmaps with quiz options */}
      <div className="space-y-4 mb-10">
        {roadmaps.map(r => {
          const completedWeeks = r.quiz_history.map(h => h.week)
          return (
            <div key={r.id} className="bg-surface-800 border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">{r.skill_name}</h2>
                <span className="text-xs text-gray-500">Week {r.current_week} / {r.total_weeks}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: r.total_weeks }, (_, i) => i + 1).map(week => {
                  const attempt = r.quiz_history.find(h => h.week === week)
                  const hasScore = attempt && typeof attempt.score === 'number'
                  return (
                    <button key={week}
                      onClick={() => navigate(`/quiz?roadmap=${r.id}&week=${week}`)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors cursor-pointer bg-surface-700/50 border border-white/5 hover:bg-surface-700 hover:border-brand-500/30">
                      <div className="flex items-center gap-2">
                        {hasScore ? (
                          <CheckCircle size={14} className={attempt.score >= 70 ? 'text-green-400' : 'text-yellow-400'} />
                        ) : (
                          <Play size={14} className="text-gray-400" />
                        )}
                        <span className="text-foreground">Week {week}</span>
                      </div>
                      {hasScore ? (
                        <span className={`text-xs font-medium ${attempt.score >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>{attempt.score}%</span>
                      ) : (
                        <ChevronRight size={14} className="text-gray-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent attempts */}
      {recentAttempts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Attempts</h2>
          <div className="space-y-2">
            {recentAttempts.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-surface-800 border border-white/5 rounded-xl px-5 py-3">
                <div>
                  <span className="text-sm text-foreground font-medium">{a.skill}</span>
                  <span className="text-xs text-gray-500 ml-2">Week {a.week}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${a.score >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>{a.score}%</span>
                  <span className="text-xs text-gray-500">{new Date(a.taken_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Active quiz component
function ActiveQuiz({ roadmapId, week }) {
  const navigate = useNavigate()
  const recordQuiz = useGamificationStore(s => s.recordQuiz)

  const [questions, setQuestions] = useState([])
  const [skill, setSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    generateQuiz()
  }, [roadmapId, week])

  async function generateQuiz() {
    try {
      const { data } = await api.post('/quiz/generate', { roadmap_id: roadmapId, week })
      setQuestions(data.questions || [])
      setSkill(data.skill)
    } catch { toast.error('Failed to generate quiz'); navigate('/quiz') }
    finally { setLoading(false) }
  }

  function selectAnswer(qId, answer) {
    setAnswers(prev => ({ ...prev, [qId]: answer }))
  }

  async function submitQuiz() {
    if (Object.keys(answers).length < questions.length) {
      return toast.error('Please answer all questions')
    }
    setSubmitting(true)
    try {
      const candidateAnswers = questions.map(q => answers[q.id] || '')
      const { data } = await api.post('/quiz/submit', {
        roadmap_id: roadmapId, week, questions, candidate_answers: candidateAnswers
      })
      setResult(data)

      // Award XP and record quiz completion
      const score = data.score_percent || 0;
      recordQuiz(score);
    } catch { toast.error('Failed to submit quiz') }
    finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-400" size={32} />
      <span className="ml-3 text-gray-400">Generating quiz...</span>
    </div>
  )

  // Show results
  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/quiz')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-foreground mb-6 cursor-pointer">
          <ArrowLeft size={16} /> Back to Quizzes
        </button>

        <div className="bg-surface-800 border border-white/5 rounded-xl p-8 text-center mb-6">
          <Trophy size={48} className={`mx-auto mb-4 ${result.score_percent >= 70 ? 'text-yellow-400' : 'text-gray-500'}`} />
          <h2 className="text-3xl font-bold text-foreground mb-2">{result.score_percent}%</h2>
          <p className="text-gray-400">{skill} — Week {week} Quiz</p>
          <p className="text-sm text-gray-500 mt-1">{result.total_earned}/{result.total_possible} points</p>

          {/* XP Earned */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-brand-300">
              <Star size={16} />
              <span className="font-semibold">+{Math.round(result.score_percent * 1.5)} XP Earned</span>
            </div>
          </div>
        </div>

        {result.feedback && (
          <div className="bg-surface-800 border border-white/5 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-3">AI Feedback</h3>
            <p className="text-sm text-gray-300 mb-3">{result.feedback.overall_message}</p>
            {result.feedback.weak_areas?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-gray-400">Areas to review: </span>
                <span className="text-xs text-yellow-400">{result.feedback.weak_areas.join(', ')}</span>
              </div>
            )}
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${result.feedback.ready_for_next_week ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {result.feedback.ready_for_next_week ? <CheckCircle size={12} /> : <Clock size={12} />}
              {result.feedback.ready_for_next_week ? 'Ready for next week!' : 'Review recommended'}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {(result.results || []).map((r, i) => (
            <div key={i} className={`bg-surface-800 border rounded-xl p-4 ${r.is_correct ? 'border-green-500/20' : 'border-red-500/20'}`}>
              <div className="flex items-start gap-3">
                {r.is_correct ? <CheckCircle size={18} className="text-green-400 mt-0.5 shrink-0" /> : <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />}
                <div>
                  <p className="text-sm text-foreground">{r.question}</p>
                  <div className="mt-2 text-xs">
                    <span className="text-gray-400">Your answer: </span>
                    <span className={r.is_correct ? 'text-green-400' : 'text-red-400'}>{r.candidate_answer}</span>
                    {!r.is_correct && (
                      <>
                        <span className="text-gray-400 ml-3">Correct: </span>
                        <span className="text-green-400">{r.correct_answer}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Quiz in progress
  const q = questions[currentQ]
  if (!q) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/quiz')}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-foreground mb-6 cursor-pointer">
        <ArrowLeft size={16} /> Back to Quizzes
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-display font-bold text-foreground">{skill} — Week {week} Quiz</h1>
        <span className="text-sm text-gray-400">{currentQ + 1} / {questions.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-surface-700 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>

      <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="bg-surface-800 border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] px-2 py-0.5 bg-surface-700 rounded-full text-gray-400">{q.type} · {q.points} pts</span>
          <span className="text-[10px] text-gray-500">{q.topic}</span>
        </div>
        <h2 className="text-lg text-foreground mb-6">{q.question}</h2>

        {q.type === 'mcq' && q.options && (
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const letter = opt.charAt(0)
              const selected = answers[q.id] === letter
              return (
                <button key={oi} onClick={() => selectAnswer(q.id, letter)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors cursor-pointer ${selected ? 'bg-brand-500/20 border border-brand-500/40 text-foreground' : 'bg-surface-700/50 border border-white/5 text-gray-300 hover:bg-surface-700'}`}>
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {q.type === 'true_false' && (
          <div className="flex gap-3">
            {['true', 'false'].map(val => (
              <button key={val} onClick={() => selectAnswer(q.id, val)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer capitalize ${answers[q.id] === val ? 'bg-brand-500/20 border border-brand-500/40 text-foreground' : 'bg-surface-700/50 border border-white/5 text-gray-300 hover:bg-surface-700'}`}>
                {val}
              </button>
            ))}
          </div>
        )}

        {(q.type === 'fill_blank' || q.type === 'short_answer') && (
          <input value={answers[q.id] || ''} onChange={e => selectAnswer(q.id, e.target.value)}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 bg-surface-700 border border-white/10 rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500" />
        )}
      </motion.div>

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
          className="px-4 py-2 text-sm text-gray-400 hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer">
          Previous
        </button>
        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ(currentQ + 1)}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
            Next
          </button>
        ) : (
          <button onClick={submitQuiz} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Trophy size={16} /> Submit Quiz</>}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Quiz() {
  const [params] = useSearchParams()
  const roadmapId = params.get('roadmap')
  const week = parseInt(params.get('week') || '1')

  // If no roadmap param, show the quiz landing/dashboard
  if (!roadmapId) return <QuizLanding />

  // Otherwise, show the active quiz
  return <ActiveQuiz roadmapId={roadmapId} week={week} />
}

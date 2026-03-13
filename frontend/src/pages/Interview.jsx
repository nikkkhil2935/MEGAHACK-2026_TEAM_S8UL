import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Volume2, ChevronRight, StopCircle,
  Clock, EyeOff, AlertTriangle, Camera, Globe
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/auth'

// TTS
function speak(text, lang = 'en', onEnd = null) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const langMap = { en: 'en-US', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ar: 'ar-SA', zh: 'zh-CN', pt: 'pt-BR' }
  utterance.lang = langMap[lang] || 'en-US'
  utterance.rate = 0.88
  utterance.pitch = 1.05
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.lang === utterance.lang && v.localService) || voices.find(v => v.lang.startsWith(lang))
  if (preferred) utterance.voice = preferred
  utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

// STT Hook
function useSpeechRecognition(language = 'en') {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recRef = useRef(null)
  const langMap = { en: 'en-US', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ar: 'ar-SA', zh: 'zh-CN', pt: 'pt-BR' }

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Speech recognition not supported. Use Chrome.'); return }
    recRef.current = new SR()
    recRef.current.continuous = true
    recRef.current.interimResults = true
    recRef.current.lang = langMap[language] || 'en-US'
    recRef.current.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setTranscript(text)
    }
    recRef.current.onerror = (e) => { if (e.error !== 'aborted') toast.error(`Mic error: ${e.error}`) }
    recRef.current.start()
    setIsListening(true)
  }, [language])

  const stopListening = useCallback(() => {
    recRef.current?.stop()
    setIsListening(false)
  }, [])

  return { transcript, setTranscript, isListening, startListening, stopListening }
}

export default function Interview() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuthStore()
  const jobId = params.get('job_id')

  const [phase, setPhase] = useState('setup')
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [followupQ, setFollowupQ] = useState(null)
  const [timer, setTimer] = useState(0)
  const [integrityAlerts, setAlerts] = useState([])
  const [config, setConfig] = useState({
    type: 'mixed', difficulty: 'mid',
    language: user?.preferred_language || 'en',
    job_id: jobId
  })

  const timerRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)

  const { transcript, setTranscript, isListening, startListening, stopListening } = useSpeechRecognition(config.language)

  // Camera
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)
    } catch { toast.error('Camera access denied.') }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOn(false)
  }

  // Tab switch detection
  useEffect(() => {
    const handler = () => {
      if (document.hidden && sessionId && phase === 'active') {
        setAlerts(prev => [...prev, { type: 'tab_switch', time: Date.now() }])
        api.post('/interview/integrity', { session_id: sessionId, event_type: 'tab_switch' }).catch(() => {})
        toast.error('Tab switch detected!', { duration: 4000 })
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [sessionId, phase])

  async function startInterview() {
    try {
      await startCamera()
      setPhase('loading')
      const { data } = await api.post('/interview/start', { ...config, interview_type: config.type })
      setSessionId(data.session_id)
      setQuestions(data.questions)
      setPhase('active')
      setTimeout(() => speakQuestion(data.questions[0]), 800)
    } catch (err) {
      setPhase('setup')
      toast.error(err.response?.data?.error || 'Failed to start interview')
    }
  }

  function speakQuestion(question) {
    setAiSpeaking(true)
    speak(question.question, config.language, () => { setAiSpeaking(false); startTimer() })
  }

  function startTimer() {
    setTimer(0)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
  }

  async function submitAnswer() {
    if (!transcript.trim()) { toast.error('Please say something first!'); return }
    clearInterval(timerRef.current)
    stopListening()
    setPhase('processing')
    try {
      const { data } = await api.post('/interview/answer', { session_id: sessionId, question_index: currentQ, transcript })
      setAnswers(prev => [...prev, { transcript, evaluation: data.evaluation }])
      if (data.followup_question) {
        setFollowupQ(data.followup_question)
        setPhase('active')
        toast('Cross-examining your answer...', { icon: '🔍' })
        setTimeout(() => { speak(data.followup_question, config.language, () => { setFollowupQ(null); setTranscript(''); startTimer() }) }, 400)
        return
      }
      const nextQ = currentQ + 1
      if (nextQ < questions.length) {
        setCurrentQ(nextQ); setTranscript(''); setFollowupQ(null); setPhase('active')
        setTimeout(() => speakQuestion(questions[nextQ]), 600)
      } else { await endInterview() }
    } catch { toast.error('Error evaluating answer.'); setPhase('active') }
  }

  async function endInterview() {
    setPhase('ending')
    speak('Great job completing the interview. Generating your detailed report now.', config.language)
    try {
      await api.post('/interview/end', { session_id: sessionId })
      stopCamera()
      navigate(`/interview/report/${sessionId}`)
    } catch { toast.error('Error generating report'); setPhase('active') }
  }

  const progress = questions.length ? (currentQ / questions.length) * 100 : 0
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const typeColor = (type) => ({
    technical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    behavioral: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    situational: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    motivation: 'bg-green-500/20 text-green-300 border-green-500/30',
  }[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30')

  // SETUP SCREEN
  if (phase === 'setup') return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center"><Mic className="text-brand-400" size={20} /></div>
          <h1 className="text-2xl font-display font-bold text-white">AI Mock Interview</h1>
        </div>
        <p className="text-gray-400 text-sm mb-8">The AI will speak questions aloud. Answer verbally. Weak answers trigger cross-examination. Camera + eye tracking stays on throughout.</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Interview Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['mixed','technical','behavioral','hr'].map(type => (
                <button key={type} onClick={() => setConfig(p => ({ ...p, type }))}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium capitalize border transition-all cursor-pointer ${
                    config.type === type ? 'bg-brand-500/20 border-brand-500/50 text-brand-300' : 'bg-surface-700 border-white/5 text-gray-400 hover:border-white/20'
                  }`}>
                  {type === 'mixed' ? 'Mixed' : type === 'technical' ? 'Technical' : type === 'behavioral' ? 'Behavioral' : 'HR Round'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Experience Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ val: 'fresher', label: 'Fresher', sub: '0-1 YOE' }, { val: 'mid', label: 'Mid', sub: '2-4 YOE' }, { val: 'senior', label: 'Senior', sub: '5+ YOE' }].map(({ val, label, sub }) => (
                <button key={val} onClick={() => setConfig(p => ({ ...p, difficulty: val }))}
                  className={`py-2.5 px-3 rounded-xl text-sm border transition-all cursor-pointer ${
                    config.difficulty === val ? 'bg-accent-500/20 border-accent-500/50 text-accent-400' : 'bg-surface-700 border-white/5 text-gray-400 hover:border-white/20'
                  }`}>
                  <div className="font-medium">{label}</div><div className="text-xs opacity-70">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block flex items-center gap-1"><Globe size={12} /> Language</label>
            <select className="input-field" value={config.language} onChange={e => setConfig(p => ({ ...p, language: e.target.value }))}>
              <option value="en">English</option><option value="hi">Hindi</option><option value="es">Spanish</option>
              <option value="fr">French</option><option value="de">German</option><option value="ar">Arabic</option>
              <option value="zh">Mandarin</option><option value="pt">Portuguese</option>
            </select>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <p className="text-yellow-300 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>Camera activates during interview. Tab-switch detection is enabled. Violations reduce your Integrity Score.</span>
          </p>
        </div>

        <button onClick={startInterview} className="btn-primary w-full text-center flex items-center justify-center gap-2">
          <Mic size={18} /> Start Interview
        </button>
      </motion.div>
    </div>
  )

  // LOADING
  if (phase === 'loading') return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-300 font-medium">Generating personalised questions...</p>
        <p className="text-gray-500 text-sm mt-1">Referencing your projects and skills</p>
      </div>
    </div>
  )

  // ACTIVE INTERVIEW
  return (
    <div className="min-h-screen bg-surface-900 text-white flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-white/5 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-mono">Q{currentQ + 1}/{questions.length}</span>
          <div className="w-40 h-1.5 bg-surface-700 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {integrityAlerts.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-1">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-red-300 text-xs font-medium">{integrityAlerts.length} alerts</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-400"><Clock size={14} /><span className="font-mono text-sm">{fmtTime(timer)}</span></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 max-w-3xl mx-auto w-full">
          <AnimatePresence>
            {aiSpeaking && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 bg-brand-500/10 border border-brand-500/30 rounded-2xl p-4">
                <Volume2 className="text-brand-400 flex-shrink-0" size={18} />
                <span className="text-brand-300 text-sm font-medium">AI Interviewer is speaking...</span>
                <div className="flex gap-1 ml-auto items-end h-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 bg-brand-400 rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s`, height: `${30 + Math.sin(i * 1.2) * 40}%` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question */}
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${typeColor(questions[currentQ]?.type)}`}>
                {questions[currentQ]?.type?.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500 capitalize">{questions[currentQ]?.difficulty}</span>
            </div>
            <p className="text-lg text-white leading-relaxed font-medium">{followupQ || questions[currentQ]?.question}</p>
            {followupQ && (
              <div className="mt-3 flex items-center gap-2 text-yellow-400 text-xs font-semibold">
                <AlertTriangle size={14} /> Cross-examination — AI is probing your previous answer
              </div>
            )}
          </motion.div>

          {/* Transcript */}
          <motion.div className={`glass-card p-5 min-h-28 transition-all ${isListening ? 'border-brand-500/40' : ''}`} style={isListening ? { boxShadow: '0 0 20px rgba(15, 168, 168, 0.3)' } : {}} layout>
            <div className="flex items-center gap-2 mb-3">
              {isListening && <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
              <span className="text-xs text-gray-500">{isListening ? 'Recording your answer...' : 'Your answer will appear here as you speak'}</span>
            </div>
            <p className="text-gray-200 leading-relaxed text-sm">
              {transcript || <span className="text-gray-600 italic">Click "Start Speaking" after the AI finishes the question...</span>}
            </p>
          </motion.div>

          {/* Controls */}
          {phase === 'processing' || phase === 'ending' ? (
            <div className="flex items-center justify-center py-8 gap-3 text-brand-400">
              <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">{phase === 'ending' ? 'Generating your report...' : 'Evaluating your answer...'}</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={isListening ? stopListening : startListening} disabled={aiSpeaking}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  isListening ? 'bg-red-600 hover:bg-red-500 text-white' : 'btn-primary disabled:opacity-40 disabled:cursor-not-allowed'
                }`}>
                {isListening ? <><MicOff size={18} /> Stop Recording</> : <><Mic size={18} /> Start Speaking</>}
              </button>
              <button onClick={submitAnswer} disabled={!transcript.trim() || aiSpeaking || isListening}
                className="flex-1 flex items-center justify-center gap-2 btn-ghost py-4 text-sm font-semibold disabled:opacity-30 cursor-pointer">
                <ChevronRight size={18} /> Submit Answer
              </button>
            </div>
          )}

          {answers.length > 3 && phase === 'active' && (
            <button onClick={endInterview}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-sm font-medium py-3 rounded-xl transition-colors cursor-pointer">
              <StopCircle size={16} /> End Interview Early
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 border-l border-white/5 p-4 flex flex-col gap-4 flex-shrink-0 hidden lg:flex">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1"><Camera size={12} /> Camera Feed</p>
            <div className="relative bg-surface-700 rounded-xl overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!cameraOn && <div className="absolute inset-0 flex items-center justify-center text-gray-500"><EyeOff size={24} /></div>}
              {cameraOn && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /><span className="text-xs text-gray-300">LIVE</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Integrity</p>
            <div className="glass-card p-3">
              <div className="text-2xl font-bold text-green-400">{Math.max(0, 100 - (integrityAlerts.length * 10))}<span className="text-sm text-gray-500 font-normal">/100</span></div>
              <div className="mt-2 space-y-1">
                {integrityAlerts.slice(-3).map((a, i) => (
                  <div key={i} className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={10} />{a.type === 'tab_switch' ? 'Tab switched' : 'Eye drift'}</div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Progress</p>
            <div className="flex flex-wrap">
              {questions.slice(0, 10).map((q, i) => (
                <div key={i} className={`w-6 h-6 inline-flex items-center justify-center text-xs font-bold rounded-lg m-0.5 transition-all ${
                  i < answers.length ? 'bg-green-500/30 text-green-300' :
                  i === currentQ ? 'bg-brand-500/30 text-brand-300 ring-1 ring-brand-500' : 'bg-surface-700 text-gray-600'
                }`}>{i + 1}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

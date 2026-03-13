import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Volume2, ChevronRight, StopCircle,
  Clock, EyeOff, AlertTriangle, Camera, Globe, Send
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/auth'

// ElevenLabs TTS with browser fallback
async function speak(text, lang = 'en', onEnd = null) {
  window.speechSynthesis.cancel()
  try {
    const res = await api.post('/tts/speak', { text, language: lang }, { responseType: 'blob', timeout: 15000 })
    if (res.data && res.data.size > 0) {
      const url = URL.createObjectURL(res.data)
      const audio = new Audio(url)
      audio.onended = () => { URL.revokeObjectURL(url); onEnd?.() }
      audio.onerror = () => { URL.revokeObjectURL(url); browserTTS(text, lang, onEnd) }
      audio.play().catch(() => browserTTS(text, lang, onEnd))
      return
    }
  } catch { /* fallback */ }
  browserTTS(text, lang, onEnd)
}

function browserTTS(text, lang, onEnd) {
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

// STT Hook — fixed accumulation
function useSpeechRecognition(language = 'en') {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recRef = useRef(null)
  const finalRef = useRef('')
  const langMap = { en: 'en-US', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ar: 'ar-SA', zh: 'zh-CN', pt: 'pt-BR' }

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Speech recognition not supported. Use Chrome.'); return }
    finalRef.current = ''
    setTranscript('')
    recRef.current = new SR()
    recRef.current.continuous = true
    recRef.current.interimResults = true
    recRef.current.lang = langMap[language] || 'en-US'
    recRef.current.onresult = (e) => {
      let final = '', interim = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + ' '
        } else {
          interim += e.results[i][0].transcript
        }
      }
      if (final) finalRef.current = final
      setTranscript((finalRef.current + interim).trim())
    }
    recRef.current.onerror = (e) => {
      if (e.error === 'no-speech') return
      if (e.error !== 'aborted') toast.error(`Mic error: ${e.error}`)
    }
    recRef.current.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recRef.current && isListening) {
        try { recRef.current.start() } catch {}
      }
    }
    recRef.current.start()
    setIsListening(true)
  }, [language])

  const stopListening = useCallback(() => {
    setIsListening(false)
    try { recRef.current?.stop() } catch {}
    recRef.current = null
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
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState('voice')

  const timerRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)

  const { transcript, setTranscript, isListening, startListening, stopListening } = useSpeechRecognition(config.language)

  // Camera — HD for clear vision
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user', frameRate: { ideal: 30 } },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
      setCameraOn(true)
    } catch { toast.error('Camera access denied. Please allow camera permissions.') }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }

  // Attach stream when videoRef mounts
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  })

  // Tab switch detection
  useEffect(() => {
    const handler = () => {
      if (document.hidden && sessionId && phase === 'active') {
        setAlerts(prev => [...prev, { type: 'tab_switch', time: Date.now() }])
        api.post('/interview/integrity', { session_id: sessionId, event_type: 'tab_switch' }).catch(() => {})
        toast.error('⚠️ Tab switch detected!', { duration: 4000 })
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [sessionId, phase])

  // Timer cleanup
  useEffect(() => () => clearInterval(timerRef.current), [])

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
      toast.error(err.response?.data?.error || 'Failed to start. Upload your resume first.')
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
    const answerText = inputMode === 'voice' ? transcript : textInput
    if (!answerText.trim()) { toast.error('Please provide an answer first!'); return }
    clearInterval(timerRef.current)
    if (isListening) stopListening()
    setPhase('processing')
    try {
      const { data } = await api.post('/interview/answer', { session_id: sessionId, question_index: currentQ, transcript: answerText })
      setAnswers(prev => [...prev, { transcript: answerText, evaluation: data.evaluation }])
      if (data.followup_question) {
        setFollowupQ(data.followup_question)
        setPhase('active')
        toast('🔍 Cross-examining your answer...')
        setTimeout(() => {
          setAiSpeaking(true)
          speak(data.followup_question, config.language, () => {
            setAiSpeaking(false); setFollowupQ(null)
            setTranscript(''); setTextInput(''); startTimer()
          })
        }, 400)
        return
      }
      const nextQ = currentQ + 1
      if (nextQ < questions.length) {
        setCurrentQ(nextQ); setTranscript(''); setTextInput(''); setFollowupQ(null); setPhase('active')
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

  const progress = questions.length ? ((currentQ + (answers.length > currentQ ? 1 : 0)) / questions.length) * 100 : 0
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const typeColor = (type) => ({
    technical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    behavioral: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    situational: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    motivation: 'bg-green-500/20 text-green-300 border-green-500/30',
  }[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30')

  // ═══════ SETUP SCREEN ═══════
  if (phase === 'setup') return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center"><Mic className="text-brand-400" size={20} /></div>
          <h1 className="text-2xl font-display font-bold text-white">AI Mock Interview</h1>
        </div>
        <p className="text-gray-400 text-sm mb-8">AI speaks questions using ElevenLabs voice. Answer by voice or text. Camera + integrity monitoring stays on throughout.</p>

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

  // ═══════ LOADING ═══════
  if (phase === 'loading') return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-300 font-medium">Generating personalised questions...</p>
        <p className="text-gray-500 text-sm mt-1">Referencing your projects and skills</p>
      </div>
    </div>
  )

  // ═══════ ACTIVE INTERVIEW — 70/30 LAYOUT ═══════
  return (
    <div className="h-screen bg-surface-900 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="border-b border-white/5 px-4 py-2.5 flex items-center justify-between flex-shrink-0 bg-surface-900/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-mono">Q{currentQ + 1}/{questions.length}</span>
          <div className="w-32 h-1.5 bg-surface-700 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {integrityAlerts.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-lg px-2.5 py-1">
              <AlertTriangle size={12} className="text-red-400" />
              <span className="text-red-300 text-xs font-medium">{integrityAlerts.length} alerts</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-400"><Clock size={14} /><span className="font-mono text-sm">{fmtTime(timer)}</span></div>
          <div className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-semibold">
            {Math.max(0, 100 - (integrityAlerts.length * 10))}%
          </div>
        </div>
      </div>

      {/* Main — 70/30 split */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: 70% — Camera Feed */}
        <div className="w-[70%] relative bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay muted playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900">
              <EyeOff size={48} className="text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm">Camera initializing...</p>
            </div>
          )}

          {/* Live indicator */}
          {cameraOn && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-white font-medium">LIVE</span>
            </div>
          )}

          {/* AI Speaking overlay */}
          <AnimatePresence>
            {aiSpeaking && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-md border border-brand-500/30 rounded-2xl p-4 flex items-center gap-3">
                <Volume2 className="text-brand-400 flex-shrink-0" size={20} />
                <span className="text-brand-300 text-sm font-medium flex-1">AI Interviewer is speaking...</span>
                <div className="flex gap-1 items-end h-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 bg-brand-400 rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s`, height: `${30 + Math.sin(i * 1.2) * 40}%` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording indicator */}
          {isListening && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm rounded-full px-3 py-1.5">
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-white rounded-full" />
              <span className="text-xs text-white font-medium">REC</span>
            </div>
          )}

          {/* Integrity alerts overlay */}
          {integrityAlerts.length > 0 && integrityAlerts[integrityAlerts.length - 1].time > Date.now() - 5000 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-white" />
              <span className="text-white text-xs font-medium">Integrity violation detected!</span>
            </div>
          )}
        </div>

        {/* RIGHT: 30% — Question + Controls */}
        <div className="w-[30%] border-l border-white/5 flex flex-col bg-surface-900 overflow-hidden">
          {/* Question */}
          <div className="p-4 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeColor(questions[currentQ]?.type)}`}>
                {questions[currentQ]?.type?.toUpperCase()}
              </span>
              <span className="text-[10px] text-gray-500 capitalize">{questions[currentQ]?.difficulty}</span>
            </div>
            <motion.p key={currentQ} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-sm text-white leading-relaxed font-medium">
              {followupQ || questions[currentQ]?.question}
            </motion.p>
            {followupQ && (
              <div className="mt-2 flex items-center gap-1.5 text-yellow-400 text-[10px] font-semibold">
                <AlertTriangle size={10} /> Cross-examination
              </div>
            )}
          </div>

          {/* Answer Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Mode toggle */}
            <div className="flex bg-surface-800 rounded-lg p-0.5">
              <button onClick={() => setInputMode('voice')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${inputMode === 'voice' ? 'bg-brand-500 text-white' : 'text-gray-400'}`}>
                <Mic size={12} className="inline mr-1" />Voice
              </button>
              <button onClick={() => setInputMode('text')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${inputMode === 'text' ? 'bg-brand-500 text-white' : 'text-gray-400'}`}>
                <Send size={12} className="inline mr-1" />Type
              </button>
            </div>

            {inputMode === 'voice' ? (
              <>
                {/* Voice transcript */}
                <div className={`bg-surface-800 rounded-xl p-3 min-h-[100px] border transition-colors ${isListening ? 'border-brand-500/40' : 'border-white/5'}`}
                  style={isListening ? { boxShadow: '0 0 15px rgba(15, 168, 168, 0.2)' } : {}}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {isListening && <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-red-500 rounded-full" />}
                    <span className="text-[10px] text-gray-500">{isListening ? 'Listening...' : 'Click record to start'}</span>
                  </div>
                  <p className="text-gray-200 text-xs leading-relaxed">
                    {transcript || <span className="text-gray-600 italic">Your answer appears here as you speak...</span>}
                  </p>
                </div>

                {/* Voice controls */}
                <button onClick={isListening ? stopListening : startListening} disabled={aiSpeaking}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                    isListening ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-brand-500 hover:bg-brand-400 text-white disabled:opacity-40'
                  }`}>
                  {isListening ? <><MicOff size={16} /> Stop</> : <><Mic size={16} /> Record</>}
                </button>
              </>
            ) : (
              /* Text input mode */
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full bg-surface-800 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 resize-none"
                rows={6}
              />
            )}

            {/* Submit */}
            {phase === 'processing' || phase === 'ending' ? (
              <div className="flex items-center justify-center py-4 gap-2 text-brand-400">
                <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">{phase === 'ending' ? 'Generating report...' : 'Evaluating...'}</span>
              </div>
            ) : (
              <button onClick={submitAnswer}
                disabled={!(inputMode === 'voice' ? transcript : textInput).trim() || aiSpeaking}
                className="w-full flex items-center justify-center gap-2 bg-surface-700 hover:bg-surface-600 text-white py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-30">
                <ChevronRight size={16} /> Submit Answer
              </button>
            )}

            {answers.length > 3 && phase === 'active' && (
              <button onClick={endInterview}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-xs font-medium py-2.5 rounded-xl transition-colors cursor-pointer">
                <StopCircle size={14} /> End Early
              </button>
            )}
          </div>

          {/* Progress dots */}
          <div className="p-3 border-t border-white/5 flex-shrink-0">
            <div className="flex flex-wrap gap-1 justify-center">
              {questions.slice(0, 10).map((q, i) => (
                <div key={i} className={`w-5 h-5 inline-flex items-center justify-center text-[10px] font-bold rounded-md transition-all ${
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

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Volume2, StopCircle, Clock, AlertTriangle,
  Globe, Send, PhoneOff, User, Bot, Loader2, Upload, Calendar, MapPin, Copy, Check, EyeOff, Users
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/auth'
import { generateICS, downloadICS, formatDateTime, getNextInterviewSlot, generateMeetingLink } from '../utils/calendarUtils'

const PANELISTS = {
  alex: { name: 'Alex Chen', role: 'Technical Lead', color: '#0fa8a8' },
  sarah: { name: 'Sarah Miller', role: 'HR Manager', color: '#a855f7' },
  david: { name: 'David Park', role: 'Behavioral Analyst', color: '#f59e0b' },
}

/* ────── ElevenLabs TTS with browser fallback ────── */
async function speak(text, lang = 'en') {
  window.speechSynthesis.cancel()
  return new Promise(async (resolve) => {
    try {
      const res = await api.post('/tts/speak', { text, language: lang }, { responseType: 'blob', timeout: 15000 })
      if (res.data?.size > 0) {
        const url = URL.createObjectURL(res.data)
        const audio = new Audio(url)
        audio.onended = () => { URL.revokeObjectURL(url); resolve() }
        audio.onerror = () => { URL.revokeObjectURL(url); browserTTS(text, lang, resolve) }
        audio.play().catch(() => browserTTS(text, lang, resolve))
        return
      }
    } catch { /* fallback */ }
    browserTTS(text, lang, resolve)
  })
}

function browserTTS(text, lang, onEnd) {
  const utterance = new SpeechSynthesisUtterance(text)
  const langMap = { en: 'en-US', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ar: 'ar-SA', zh: 'zh-CN', pt: 'pt-BR' }
  utterance.lang = langMap[lang] || 'en-US'
  utterance.rate = 0.9
  utterance.pitch = 1.05
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.lang === utterance.lang && v.localService) || voices.find(v => v.lang.startsWith(lang))
  if (preferred) utterance.voice = preferred
  utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

/* ────── Audio Recorder Hook (MediaRecorder → Blob) ────── */
function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  const startRecording = useCallback(async () => {
    try {
      setAudioBlob(null)
      chunksRef.current = []
      setRecordingTime(0)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      recorder.start(250) // collect chunks every 250ms
      setIsRecording(true)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch (err) {
      toast.error('Microphone access denied')
    }
  }, [])

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current)
    setIsRecording(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    setRecordingTime(0)
    chunksRef.current = []
  }, [])

  useEffect(() => () => {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  return { isRecording, audioBlob, recordingTime, startRecording, stopRecording, resetRecording }
}

/* ────── Main Interview Component ────── */
export default function Interview() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuthStore()
  const jobId = params.get('job_id')

  // State
  const [phase, setPhase] = useState('setup') // setup | loading | active | processing | ending
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
    job_id: jobId,
    panel_mode: false
  })
  const [inputMode, setInputMode] = useState('voice')
  const [textInput, setTextInput] = useState('')
  const [jdText, setJdText] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)

  // Calendar scheduling
  const [scheduledDate, setScheduledDate] = useState(() => {
    const nextSlot = getNextInterviewSlot()
    return nextSlot.toISOString().split('T')[0]
  })
  const [scheduledTime, setScheduledTime] = useState('10:00')
  const [meetingLink, setMeetingLink] = useState(generateMeetingLink())
  const [copiedLink, setCopiedLink] = useState(false)

  // Conversation log: { role: 'ai'|'user', text, time, type? }
  const [conversation, setConversation] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Refs
  const timerRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const chatEndRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)

  const { isRecording, audioBlob, recordingTime, startRecording, stopRecording, resetRecording } = useAudioRecorder()

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Auto-submit when recording stops and audioBlob is ready
  useEffect(() => {
    if (audioBlob && phase === 'active' && !submitting && !isTranscribing) {
      submitAudioAnswer(audioBlob)
    }
  }, [audioBlob])

  /* ── Camera ── */
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
    } catch { toast.error('Camera access denied') }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }

  // Re-attach stream on ref change
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
        toast.error('⚠️ Tab switch detected!')
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [sessionId, phase])

  // Timer
  useEffect(() => () => clearInterval(timerRef.current), [])

  function startTimer() {
    setTimer(0)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
  }

  /* ── AI adds message to conversation ── */
  function addAIMessage(text, type = 'question', panelist = null) {
    setConversation(prev => [...prev, { role: 'ai', text, time: new Date(), type, panelist }])
  }
  function addUserMessage(text) {
    setConversation(prev => [...prev, { role: 'user', text, time: new Date() }])
  }

  /* ── Start Interview ── */
  async function startInterview() {
    try {
      await startCamera()
      setPhase('loading')
      const { data } = await api.post('/interview/start', {
        ...config, interview_type: config.type, panel_mode: config.panel_mode,
        jd_text: jdText || undefined
      }, { _skipAuthRedirect: true })
      setSessionId(data.session_id)
      setQuestions(data.questions)
      startTimer()

      // Greeting
      const greeting = config.panel_mode
        ? `Hello ${user?.full_name?.split(' ')[0] || 'there'}! Welcome to your panel interview. You'll be interviewed by Alex Chen (Technical Lead), Sarah Miller (HR Manager), and David Park (Behavioral Analyst). Let's begin with the first question.`
        : `Hello ${user?.full_name?.split(' ')[0] || 'there'}! Welcome to your interview. I'll be your interviewer today. Let's get started with the first question.`
      setConversation([{ role: 'ai', text: greeting, time: new Date(), type: 'greeting' }])
      setPhase('active')
      setAiSpeaking(true)
      await speak(greeting, config.language)
      setAiSpeaking(false)

      // Ask first question
      await askQuestion(data.questions[0])
    } catch (err) {
      stopCamera()
      setPhase('setup')
      const msg = err.response?.data?.error
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.')
        navigate('/login')
      } else {
        toast.error(msg || 'Failed to start. Upload your resume first.')
      }
    }
  }

  async function askQuestion(question) {
    const q = question.question
    addAIMessage(q, question.type, question.panelist)
    setAiSpeaking(true)
    await speak(q, config.language)
    setAiSpeaking(false)
  }

  /* ── Submit Audio Answer via Groq Whisper ── */
  async function submitAudioAnswer(blob) {
    if (!blob || submitting || isTranscribing) return
    setIsTranscribing(true)

    try {
      const formData = new FormData()
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      formData.append('audio', blob, `answer.${ext}`)
      formData.append('session_id', sessionId)
      formData.append('question_index', currentQ)
      formData.append('language', config.language)

      const { data } = await api.post('/interview/answer/audio', formData)
      setIsTranscribing(false)
      resetRecording()

      // Add the server's transcript as user message
      addUserMessage(data.transcript || '(no speech detected)')
      setAnswers(prev => [...prev, { transcript: data.transcript, evaluation: data.evaluation }])

      await handleEvaluation(data)
    } catch {
      setIsTranscribing(false)
      resetRecording()
      toast.error('Error transcribing/evaluating answer')
      addAIMessage("I'm sorry, there was a technical issue. Could you please repeat your answer?", 'error')
    }
  }

  /* ── Submit Text Answer ── */
  async function submitAnswer(answerText) {
    const text = answerText || textInput
    if (!text?.trim() || submitting) return
    setSubmitting(true)

    addUserMessage(text)
    setTextInput('')

    try {
      const { data } = await api.post('/interview/answer', {
        session_id: sessionId, question_index: currentQ, transcript: text
      })

      setAnswers(prev => [...prev, { transcript: text, evaluation: data.evaluation }])
      await handleEvaluation(data)
    } catch {
      toast.error('Error evaluating answer')
      addAIMessage("I'm sorry, there was a technical issue. Could you please repeat your answer?", 'error')
    }
    setSubmitting(false)
  }

  /* ── Handle evaluation response (shared by audio + text) ── */
  async function handleEvaluation(data) {
    setSubmitting(true)
    const score = data.evaluation?.overall_score
    const ack = score >= 8 ? "Excellent answer!" :
                score >= 6 ? "Good answer, thank you." :
                score >= 4 ? "Thank you for that response." :
                "I see, thank you."

    if (data.followup_question) {
      addAIMessage(ack + " Let me follow up on that...", 'followup-intro')
      setAiSpeaking(true)
      await speak(ack, config.language)
      setAiSpeaking(false)
      setFollowupQ(data.followup_question)
      addAIMessage(data.followup_question, 'followup')
      setAiSpeaking(true)
      await speak(data.followup_question, config.language)
      setAiSpeaking(false)
      setFollowupQ(null)
      setSubmitting(false)
      return
    }

    const nextQ = currentQ + 1
    if (nextQ < questions.length) {
      const transition = nextQ === questions.length - 1
        ? "Alright, last question."
        : ack + " Moving on..."
      addAIMessage(transition, 'transition')
      setAiSpeaking(true)
      await speak(transition, config.language)
      setAiSpeaking(false)

      setCurrentQ(nextQ)
      await askQuestion(questions[nextQ])
    } else {
      addAIMessage(ack + " That was the last question. Great job completing the interview! Let me generate your report.", 'closing')
      setAiSpeaking(true)
      await speak(ack + " That was the last question. Great job!", config.language)
      setAiSpeaking(false)
      await endInterview()
    }
    setSubmitting(false)
  }

  /* ── End Interview ── */
  async function endInterview() {
    setPhase('ending')
    clearInterval(timerRef.current)
    try {
      await api.post('/interview/end', { session_id: sessionId })
      stopCamera()
      navigate(`/interview/report/${sessionId}`)
    } catch {
      toast.error('Error generating report')
      setPhase('active')
    }
  }

  async function exitEarly() {
    setShowExitConfirm(false)
    if (answers.length > 0) {
      addAIMessage("Ending the interview early. Generating your report with the answers provided so far.", 'closing')
      setAiSpeaking(true)
      await speak("Ending the interview early. Let me generate your report.", config.language)
      setAiSpeaking(false)
      await endInterview()
    } else {
      stopCamera()
      clearInterval(timerRef.current)
      if (isRecording) stopRecording()
      navigate('/dashboard')
    }
  }

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const progress = questions.length ? ((answers.length) / questions.length) * 100 : 0

  /* ═══════════ SETUP SCREEN ═══════════ */
  if (phase === 'setup') return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
            <Mic className="text-brand-400" size={20} />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">AI Mock Interview</h1>
        </div>
        <p className="text-gray-400 text-sm mb-8">A live one-to-one conversation with an AI interviewer. Record your answers — transcribed by Groq Whisper AI for high accuracy.</p>

        <div className="space-y-4 mb-6">
          {/* Interview Mode: 1-on-1 vs Panel */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Interview Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfig(p => ({ ...p, panel_mode: false }))}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  !config.panel_mode ? 'bg-brand-500/20 border-brand-500/50 text-brand-300' : 'bg-surface-700 border-white/5 text-gray-400 hover:border-white/20'
                }`}>
                <User size={14} /> 1-on-1
              </button>
              <button onClick={() => setConfig(p => ({ ...p, panel_mode: true }))}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  config.panel_mode ? 'bg-brand-500/20 border-brand-500/50 text-brand-300' : 'bg-surface-700 border-white/5 text-gray-400 hover:border-white/20'
                }`}>
                <Users size={14} /> Panel (3 Interviewers)
              </button>
            </div>
            {config.panel_mode && (
              <div className="mt-2 p-3 bg-surface-800 rounded-lg border border-white/5 space-y-1">
                {Object.entries(PANELISTS).map(([id, p]) => (
                  <div key={id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-foreground font-medium">{p.name}</span>
                    <span className="text-gray-500">— {p.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Interview Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

          {/* Calendar Scheduling */}
          <div className="bg-surface-800/50 border border-brand-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Calendar size={12} /> Schedule This Interview
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                  className="input-field text-xs" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                  className="input-field text-xs" />
              </div>
            </div>

            {/* Meeting Link */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                <MapPin size={12} /> Meeting Link
              </label>
              <div className="flex gap-2">
                <input type="text" value={meetingLink} readOnly
                  className="input-field text-xs flex-1 bg-surface-700/50" />
                <button onClick={() => {
                  navigator.clipboard.writeText(meetingLink)
                  setCopiedLink(true)
                  setTimeout(() => setCopiedLink(false), 2000)
                }}
                  className="px-2 py-1 bg-brand-500/20 hover:bg-brand-500/30 rounded text-brand-300 transition-colors">
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Download Calendar */}
            <button onClick={() => {
              const icsContent = generateICS({
                title: `AI Mock Interview - ${config.type} (${config.difficulty})`,
                description: 'CareerBridge AI Mock Interview Session',
                start: new Date(`${scheduledDate}T${scheduledTime}`),
                duration: 45,
                location: meetingLink,
              })
              downloadICS(`interview-${scheduledDate}.ics`, icsContent)
              toast.success('Calendar file downloaded!')
            }}
              className="w-full mt-3 px-3 py-2 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg text-xs text-brand-300 transition-colors cursor-pointer">
              📥 Download Calendar File
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block flex items-center gap-1"><Upload size={12} /> Job Description (optional)</label>
            <textarea
              className="input-field w-full h-24 resize-none text-xs"
              placeholder="Paste the job description here to tailor interview questions..."
              value={jdText}
              onChange={e => setJdText(e.target.value)}
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <span>Or upload JD PDF:</span>
              <input type="file" accept=".pdf,.txt" className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-surface-700 file:text-gray-300 cursor-pointer"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                    toast('PDF uploaded — text will be extracted server-side', { icon: '📄' })
                    const text = await file.text().catch(() => '')
                    setJdText(prev => prev || text || `[PDF: ${file.name}]`)
                  } else {
                    const text = await file.text()
                    setJdText(text)
                  }
                }} />
            </label>
          </div>
        </div>

        <div className="bg-surface-800 border border-white/5 rounded-xl p-4 mb-6 space-y-2">
          <p className="text-gray-300 text-sm font-medium">How it works:</p>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• AI interviewer asks questions by voice — like a real interview</li>
            <li>• Tap to record your answer, tap again to finish</li>
            <li>• Audio is transcribed by Groq Whisper AI (~95% accuracy)</li>
            <li>• Or switch to text mode and type your answer</li>
            <li>• You can exit anytime with the end call button</li>
          </ul>
        </div>

        <button onClick={startInterview} className="btn-primary w-full text-center flex items-center justify-center gap-2">
          <Mic size={18} /> Start Interview
        </button>
      </motion.div>
    </div>
  )

  /* ═══════════ LOADING ═══════════ */
  if (phase === 'loading') return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-300 font-medium">Preparing your interview...</p>
        <p className="text-gray-500 text-sm mt-1">Generating personalized questions from your profile</p>
      </div>
    </div>
  )

  /* ═══════════ ACTIVE INTERVIEW ═══════════ */
  return (
    <div className="h-screen bg-surface-900 text-foreground flex flex-col overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="border-b border-white/5 px-4 py-2 flex items-center justify-between flex-shrink-0 bg-surface-900/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Live Interview</span>
          </div>
          <span className="text-xs text-gray-500 font-mono">Q {currentQ + 1} of {questions.length}</span>
          <div className="w-24 h-1 bg-surface-700 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {integrityAlerts.length > 0 && (
            <div className="flex items-center gap-1 bg-red-500/20 rounded-lg px-2 py-1">
              <AlertTriangle size={10} className="text-red-400" />
              <span className="text-red-300 text-[10px]">{integrityAlerts.length}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock size={12} /><span className="font-mono text-xs">{fmtTime(timer)}</span>
          </div>
          <button onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-medium transition-colors cursor-pointer">
            <PhoneOff size={12} /> End
          </button>
        </div>
      </div>

      {/* ── Main Content: 70% Camera / 30% Conversation ── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* LEFT: 70% — Video Feed */}
        <div className="w-full md:w-[70%] h-[40vh] md:h-auto relative bg-black flex items-center justify-center">
          <video ref={videoRef} autoPlay muted playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} />

          {!cameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900">
              <EyeOff size={48} className="text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm">Camera initializing...</p>
            </div>
          )}

          {/* LIVE badge */}
          {cameraOn && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-white font-medium tracking-wider">LIVE</span>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm rounded-full px-3 py-1">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-white rounded-full" />
              <span className="text-[10px] text-white font-medium">REC</span>
              <span className="text-[10px] text-white/80 font-mono">{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
            </div>
          )}

          {/* AI Interviewer Avatar (top-right corner PiP) */}
          <div className="absolute bottom-4 right-4 w-28 h-28 rounded-2xl bg-surface-800 border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
            <div className={`w-full h-full flex flex-col items-center justify-center transition-all ${aiSpeaking ? 'bg-brand-500/10' : 'bg-surface-800'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-all ${aiSpeaking ? 'bg-brand-500/30 ring-2 ring-brand-500/50' : 'bg-surface-700'}`}>
                <Bot size={20} className={`transition-colors ${aiSpeaking ? 'text-brand-400' : 'text-gray-500'}`} />
              </div>
              <span className="text-[9px] text-gray-400 font-medium">AI Interviewer</span>
              {aiSpeaking && (
                <div className="flex gap-0.5 mt-1 items-end h-3">
                  {[...Array(4)].map((_, i) => (
                    <motion.div key={i}
                      animate={{ height: ['30%', '100%', '30%'] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className="w-0.5 bg-brand-400 rounded-full" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recording / Transcribing overlay on video */}
          <AnimatePresence>
            {(isRecording || isTranscribing) && phase === 'active' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-4 right-36 bg-black/70 backdrop-blur-md rounded-xl px-4 py-3">
                {isRecording ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      <span className="text-[10px] text-gray-400 font-medium">Recording your answer...</span>
                      <span className="text-[10px] text-gray-500 font-mono ml-auto">{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 h-6">
                      {[...Array(12)].map((_, i) => (
                        <motion.div key={i}
                          animate={{ height: ['20%', `${40 + Math.random() * 60}%`, '20%'] }}
                          transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.4, delay: i * 0.05 }}
                          className="w-1 bg-red-400 rounded-full" />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-brand-400" />
                    <span className="text-xs text-gray-300">Transcribing with Whisper AI...</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Integrity alert overlay */}
          <AnimatePresence>
            {integrityAlerts.length > 0 && integrityAlerts[integrityAlerts.length - 1].time > Date.now() - 4000 && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-white" />
                <span className="text-white text-xs font-medium">Integrity violation detected!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: 30% — Conversation + Controls */}
        <div className="w-full md:w-[30%] border-t md:border-l md:border-t-0 border-white/5 flex flex-col bg-surface-900 overflow-hidden">
          {/* Conversation log */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {conversation.map((msg, i) => {
              const panelist = msg.panelist ? PANELISTS[msg.panelist] : null
              return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                    msg.role === 'ai'
                      ? (panelist ? '' : 'bg-brand-500/20')
                      : 'bg-accent-500/20'
                  }`}
                  style={panelist ? { background: `${panelist.color}30` } : undefined}>
                  {msg.role === 'ai'
                    ? <Bot size={12} style={panelist ? { color: panelist.color } : undefined} className={!panelist ? 'text-brand-400' : ''} />
                    : <User size={12} className="text-accent-400" />}
                </div>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'ai'
                    ? 'bg-surface-800 text-gray-200 border border-white/5'
                    : 'bg-brand-500/15 text-foreground border border-brand-500/20'
                }`}>
                  {panelist && msg.role === 'ai' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider block mb-1" style={{ color: panelist.color }}>
                      {panelist.name} · {panelist.role}
                    </span>
                  )}
                  {!panelist && msg.type && msg.role === 'ai' && msg.type !== 'greeting' && msg.type !== 'transition' && msg.type !== 'closing' && msg.type !== 'error' && msg.type !== 'followup-intro' && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${
                      msg.type === 'followup' ? 'text-yellow-400' : 'text-brand-400'
                    }`}>
                      {msg.type === 'followup' ? '↳ Follow-up' : msg.type}
                    </span>
                  )}
                  {msg.text}
                </div>
              </motion.div>
              )
            })}

            {/* Show recording indicator in chat */}
            {isRecording && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex gap-2 flex-row-reverse">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 bg-accent-500/20">
                  <User size={12} className="text-accent-400" />
                </div>
                <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed bg-red-500/10 text-foreground/80 border border-red-500/20 border-dashed flex items-center gap-2">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                  <span>Recording... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
                </div>
              </motion.div>
            )}

            {/* Transcribing indicator in chat */}
            {isTranscribing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex gap-2 flex-row-reverse">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 bg-accent-500/20">
                  <User size={12} className="text-accent-400" />
                </div>
                <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed bg-brand-500/10 text-foreground/80 border border-brand-500/10 border-dashed flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-brand-400" />
                  <span>Transcribing...</span>
                </div>
              </motion.div>
            )}

            {/* AI speaking indicator */}
            {aiSpeaking && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-brand-500/20">
                  <Bot size={12} className="text-brand-400" />
                </div>
                <div className="flex items-center gap-1 bg-surface-800 rounded-xl px-3 py-2 border border-white/5">
                  <div className="flex gap-0.5 items-end h-3">
                    {[...Array(3)].map((_, i) => (
                      <motion.div key={i}
                        animate={{ height: ['20%', '100%', '20%'] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.15 }}
                        className="w-1 bg-brand-400 rounded-full" />
                    ))}
                  </div>
                  <span className="text-[10px] text-brand-300 ml-1">Speaking...</span>
                </div>
              </div>
            )}

            {/* Submitting indicator */}
            {submitting && !isTranscribing && (
              <div className="flex items-center gap-2 justify-center py-2">
                <Loader2 size={14} className="animate-spin text-brand-400" />
                <span className="text-[10px] text-gray-400">Evaluating your answer...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom Controls */}
          <div className="border-t border-white/5 p-3 space-y-2 flex-shrink-0 bg-surface-900">
            {/* Mode toggle */}
            <div className="flex bg-surface-800 rounded-lg p-0.5 mb-1">
              <button onClick={() => setInputMode('voice')}
                className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${inputMode === 'voice' ? 'bg-brand-500 text-white' : 'text-gray-400'}`}>
                <Mic size={10} className="inline mr-1" />Voice
              </button>
              <button onClick={() => setInputMode('text')}
                className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${inputMode === 'text' ? 'bg-brand-500 text-white' : 'text-gray-400'}`}>
                <Send size={10} className="inline mr-1" />Text
              </button>
            </div>

            {phase === 'ending' ? (
              <div className="flex items-center justify-center py-3 gap-2 text-brand-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Generating report...</span>
              </div>
            ) : inputMode === 'voice' ? (
              <button
                onClick={isRecording ? () => stopRecording() : startRecording}
                disabled={aiSpeaking || submitting || isTranscribing}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'bg-brand-500 hover:bg-brand-400 text-white disabled:opacity-30'
                }`}>
                {isRecording ? (
                  <><MicOff size={16} /> Tap to finish ({Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')})</>
                ) : isTranscribing ? (
                  <><Loader2 size={16} className="animate-spin" /> Transcribing...</>
                ) : (
                  <><Mic size={16} /> {aiSpeaking ? 'AI is speaking...' : 'Tap to speak'}</>
                )}
              </button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); submitAnswer(textInput) }} className="flex gap-2">
                <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={aiSpeaking || submitting || isTranscribing}
                  className="flex-1 bg-surface-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500 disabled:opacity-30" />
                <button type="submit" disabled={!textInput.trim() || aiSpeaking || submitting || isTranscribing}
                  className="px-3 py-2 bg-brand-500 hover:bg-brand-400 rounded-lg text-white transition-colors cursor-pointer disabled:opacity-30">
                  <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <PhoneOff size={20} className="text-red-400" />
                </div>
                <h3 className="font-display font-bold text-foreground text-lg">End Interview?</h3>
              </div>
              <p className="text-gray-400 text-sm mb-1">
                You've answered {answers.length} of {questions.length} questions.
              </p>
              <p className="text-gray-500 text-xs mb-5">
                {answers.length > 0
                  ? 'A report will be generated from your answers so far.'
                  : 'No answers submitted yet. You will return to the dashboard.'}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 bg-surface-700 hover:bg-surface-600 text-foreground rounded-xl text-sm font-medium transition-colors cursor-pointer">
                  Continue
                </button>
                <button onClick={exitEarly}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer">
                  End Interview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

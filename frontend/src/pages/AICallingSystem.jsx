import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneCall, PhoneOff, Search, User, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Copy, Check, Edit3, Play, Square, Bot, MessageSquare, Calendar, BarChart3 } from 'lucide-react'

/*
 * OMNIDIM SDK INTEGRATION POINT
 * Real implementation:
 * import { Client } from 'omnidim';
 * const client = new Client(process.env.OMNIDIM_API_KEY);
 * const agent = await client.agent.create({ prompt: generatedScript });
 * const call = await client.bulk_call.create_bulk_calls({
 *   name: `CareerBridge-${candidateName}-${Date.now()}`,
 *   contact_list: [{ phone_number: candidatePhone, customer_name: candidateName }],
 *   phone_number_id: phoneNumberId
 * });
 */

// ═══ SECTION: MOCK DATA ═══
const CANDIDATES = [
  { id: 1, name: 'Aarav Shah', role: 'React Developer', match: 94, consented: true, initials: 'AS', skills: ['React', 'TypeScript', 'Node.js'], interviewScore: 87, phone: '+91 ••••••7842' },
  { id: 2, name: 'Priya Nair', role: 'Data Scientist', match: 87, consented: true, initials: 'PN', skills: ['Python', 'TensorFlow', 'SQL'], interviewScore: 82, phone: '+91 ••••••3491' },
  { id: 3, name: 'Rohan Mehta', role: 'Product Manager', match: 79, consented: false, initials: 'RM', skills: ['Agile', 'Analytics', 'Strategy'], interviewScore: null, phone: null },
  { id: 4, name: 'Sneha Kapoor', role: 'UI/UX Designer', match: 83, consented: true, initials: 'SK', skills: ['Figma', 'Prototyping', 'Research'], interviewScore: 78, phone: '+91 ••••••6128' },
  { id: 5, name: 'Dev Patel', role: 'Backend Engineer', match: 91, consented: false, initials: 'DP', skills: ['Go', 'PostgreSQL', 'Docker'], interviewScore: 90, phone: null },
]

const ACTIVITY_FEED = [
  { name: 'Sneha Kapoor', role: 'UI/UX Designer', event: 'Call Completed', duration: '12 min', time: '2 min ago', status: 'completed' },
  { name: 'Dev Patel', role: 'Backend Eng.', event: 'No Consent', duration: '—', time: '5 min ago', status: 'failed' },
  { name: 'Priya Nair', role: 'Data Scientist', event: 'Call Completed', duration: '9 min', time: '18 min ago', status: 'completed' },
  { name: 'Aarav Shah', role: 'React Developer', event: 'In Progress', duration: '0:32', time: 'Just now', status: 'active' },
  { name: 'Riya Desai', role: 'QA Engineer', event: 'Call Completed', duration: '7 min', time: '1 hr ago', status: 'completed' },
  { name: 'Karan Joshi', role: 'DevOps Eng.', event: 'No Answer', duration: '—', time: '2 hr ago', status: 'failed' },
]

const TRANSCRIPT_LINES = [
  { speaker: 'ai', text: 'Hello, am I speaking with Aarav Shah?' },
  { speaker: 'candidate', text: 'Yes, speaking.' },
  { speaker: 'ai', text: "Great! I'm calling from CareerBridge regarding your React Developer application. Do you have a few minutes?" },
  { speaker: 'candidate', text: 'Sure, go ahead.' },
  { speaker: 'ai', text: 'Can you walk me through your experience with React and TypeScript?' },
  { speaker: 'candidate', text: "I've been working with React for 4 years, primarily building enterprise dashboards and component libraries with TypeScript." },
]

const COUNTRY_CODES = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'USA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+971', country: 'UAE' },
]

const TIME_OPTIONS = Array.from({ length: 13 }, (_, i) => {
  const h = i + 7
  return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`
})

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function AICallingSystem() {
  // ═══ SECTION: STATE ═══
  const [activeTab, setActiveTab] = useState('recruiter')
  
  // Recruiter state
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [pendingWarn, setPendingWarn] = useState(null)
  const [callObjective, setCallObjective] = useState('screening')
  const [callTone, setCallTone] = useState('Professional')
  const [callDuration, setCallDuration] = useState(10)
  const [jobRole, setJobRole] = useState('')
  const [keyReqs, setKeyReqs] = useState('')
  const [customInstr, setCustomInstr] = useState('')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)
  const [editingScript, setEditingScript] = useState(false)
  
  // Call state
  const [callPhase, setCallPhase] = useState(null) // null, 'dialing', 'connected', 'ended'
  const [callTimer, setCallTimer] = useState(0)
  const [transcriptIdx, setTranscriptIdx] = useState(0)
  const transcriptRef = useRef(null)
  
  // Candidate state
  const [countryCode, setCountryCode] = useState('+91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callFrom, setCallFrom] = useState('10:00 AM')
  const [callTo, setCallTo] = useState('6:00 PM')
  const [availDays, setAvailDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [language, setLanguage] = useState('English')
  const [checks, setChecks] = useState([false, false, false])
  const [notifications, setNotifications] = useState(true)
  const [consentGranted, setConsentGranted] = useState(false)
  const [consentRevoked, setConsentRevoked] = useState(false)

  // Reset when selecting candidate
  useEffect(() => {
    if (selected) {
      setJobRole(selected.role)
      setScriptReady(false)
      setScriptLoading(false)
      setCallPhase(null)
      setCallTimer(0)
      setTranscriptIdx(0)
      setEditingScript(false)
    }
  }, [selected])

  // ═══ SECTION: CALL ENGINE (Omnidim Simulation) ═══
  useEffect(() => {
    if (callPhase === 'dialing') {
      const timer = setTimeout(() => setCallPhase('connected'), 2000)
      return () => clearTimeout(timer)
    }
  }, [callPhase])

  useEffect(() => {
    if (callPhase === 'connected') {
      const interval = setInterval(() => setCallTimer(prev => prev + 1), 1000)
      return () => clearInterval(interval)
    }
  }, [callPhase])

  useEffect(() => {
    if (callPhase === 'connected' && callTimer >= 18) {
      setCallPhase('ended')
    }
  }, [callPhase, callTimer])

  useEffect(() => {
    if (callPhase === 'connected' && transcriptIdx < TRANSCRIPT_LINES.length) {
      const timer = setTimeout(() => {
        setTranscriptIdx(prev => prev + 1)
        transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [callPhase, transcriptIdx])

  function generateScript() {
    setScriptLoading(true)
    setTimeout(() => {
      setScriptLoading(false)
      setScriptReady(true)
    }, 1800)
  }

  function initiateCall() {
    setCallPhase('dialing')
    setCallTimer(0)
    setTranscriptIdx(0)
  }

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const filteredCandidates = CANDIDATES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  )

  const allChecked = checks.every(Boolean) && phoneNumber.length >= 10

  // ═══ SECTION: RENDER ═══
  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
        @keyframes slide-up { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes check-bounce { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes dot-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .pulse-ring { animation: pulse-ring 1.5s ease-out infinite; }
        .shimmer-bg { background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%); background-size: 400px 100%; animation: shimmer 1.5s infinite; }
        .slide-up { animation: slide-up 0.4s ease-out; }
        .check-bounce { animation: check-bounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .dot-blink { animation: dot-blink 1s infinite; }
      `}} />

      {/* Tab Bar */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {[
            { key: 'recruiter', icon: Phone, label: '📞 Recruiter View' },
            { key: 'candidate', icon: User, label: '👤 Candidate View' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-[#111827] text-[#111827]' : 'border-transparent text-[#6b7280] hover:text-[#111827]'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'recruiter' ? (
        // ═══ SECTION: RECRUITER VIEW ═══
        <div className="flex h-[calc(100vh-105px)]">
          {/* Column 1: Candidate Roster */}
          <div className="w-64 bg-white border-r border-[#e5e7eb] flex flex-col">
            <div className="p-4 border-b border-[#e5e7eb]">
              <h2 className="text-sm font-semibold text-[#111827] mb-3">Eligible Candidates</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#111827] bg-[#f9fafb]" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredCandidates.map(c => (
                <div key={c.id} className="relative">
                  <div onClick={() => {
                    if (c.consented) { setSelected(c); setPendingWarn(null) }
                    else { setPendingWarn(c.id); setTimeout(() => setPendingWarn(null), 3000) }
                  }}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-[#e5e7eb] cursor-pointer transition-colors ${selected?.id === c.id ? 'bg-[#f3f4f6]' : 'hover:bg-[#f9fafb]'}`}>
                    <div className="w-9 h-9 rounded-full bg-[#e5e7eb] flex items-center justify-center text-xs font-bold text-[#111827] shrink-0">{c.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#111827] truncate">{c.name}</div>
                      <div className="text-xs text-[#6b7280]">{c.role}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#111827] text-white rounded-full font-medium">{c.match}% Match</span>
                        <span className={`text-[10px] ${c.consented ? 'text-[#16a34a]' : 'text-[#6b7280]'}`}>
                          {c.consented ? '✅ Consented' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                    {c.consented && (
                      <button className="p-1.5 rounded-lg hover:bg-[#e5e7eb] transition-colors text-[#111827]">
                        <Phone size={14} />
                      </button>
                    )}
                  </div>
                  {pendingWarn === c.id && (
                    <div className="absolute left-4 right-4 -bottom-1 z-10 bg-[#fef2f2] border border-[#fecaca] rounded-lg p-2 text-xs text-[#dc2626] shadow-sm slide-up">
                      ⚠️ Candidate hasn't consented to calls yet. Outreach restricted.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: AI Call Studio */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-[#6b7280]">
                <Phone size={48} className="mb-3 opacity-20" />
                <p className="text-lg font-medium">Select a candidate</p>
                <p className="text-sm">Choose a consented candidate to start the AI call flow</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Phase 1: Candidate Brief */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#e5e7eb] flex items-center justify-center text-sm font-bold text-[#111827]">{selected.initials}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#111827]">{selected.name}</h3>
                        <p className="text-sm text-[#6b7280]">{selected.role}</p>
                      </div>
                    </div>
                    <span className="text-sm px-3 py-1 bg-[#111827] text-white rounded-full font-medium">{selected.match}% Match</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selected.skills.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 bg-[#f3f4f6] border border-[#e5e7eb] rounded-full text-[#111827] font-medium">{s}</span>
                    ))}
                  </div>
                  <div className="text-sm text-[#6b7280] space-y-1">
                    {selected.interviewScore && <p>Interview Score: <span className="font-semibold text-[#111827]">{selected.interviewScore}/100</span></p>}
                    <p>Available: Mon–Fri, 10AM–6PM IST</p>
                  </div>
                  <div className="mt-3 p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280]">
                    📋 This candidate has consented to AI-assisted calls via CareerBridge. Calls are recorded for quality assurance.
                  </div>
                </div>

                {/* Phase 2: Requirement Input */}
                {callPhase === null && (
                  <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm slide-up">
                    <h3 className="text-base font-semibold text-[#111827] mb-1">Define Your Call Requirements</h3>
                    <p className="text-xs text-[#6b7280] mb-4">Tell the AI what to communicate. Be specific — the more detail, the better the call script.</p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-[#111827] mb-1 block">Job Role</label>
                        <input value={jobRole} onChange={e => setJobRole(e.target.value)}
                          className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#111827]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#111827] mb-1 block">Key Requirements</label>
                        <textarea value={keyReqs} onChange={e => setKeyReqs(e.target.value)} rows={3}
                          placeholder="e.g. We need someone with 3+ years React experience, comfortable with remote work, available to join within 30 days..."
                          className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#111827] resize-none placeholder-[#9ca3af]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#111827] mb-2 block">Call Objective</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'screening', label: 'Initial Screening', desc: 'Verify basic eligibility and interest' },
                            { key: 'technical', label: 'Technical Pre-check', desc: 'Assess technical depth before interview' },
                            { key: 'offer', label: 'Offer Discussion', desc: 'Present offer terms and gauge interest' },
                            { key: 'schedule', label: 'Schedule Interview', desc: 'Confirm availability and book time slot' },
                          ].map(o => (
                            <div key={o.key} onClick={() => setCallObjective(o.key)}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${callObjective === o.key ? 'border-[#111827] bg-[#f9fafb]' : 'border-[#e5e7eb] hover:border-[#9ca3af]'}`}>
                              <div className={`text-sm font-medium ${callObjective === o.key ? 'text-[#111827]' : 'text-[#6b7280]'}`}>
                                {callObjective === o.key ? '◉' : '○'} {o.label}
                              </div>
                              <div className="text-[10px] text-[#9ca3af] mt-0.5">{o.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#111827] mb-2 block">Tone of Call</label>
                        <div className="flex gap-2">
                          {['Professional', 'Friendly', 'Direct'].map(t => (
                            <button key={t} onClick={() => setCallTone(t)}
                              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${callTone === t ? 'bg-[#111827] text-white' : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#111827] mb-2 block">Max Call Duration: <span className="text-[#6b7280]">{callDuration} minutes</span></label>
                        <input type="range" min={5} max={30} step={5} value={callDuration} onChange={e => setCallDuration(Number(e.target.value))}
                          className="w-full accent-[#111827]" />
                        <div className="flex justify-between text-[10px] text-[#9ca3af]"><span>5 min</span><span>30 min</span></div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#111827] mb-1 block">Custom Instructions (optional)</label>
                        <textarea value={customInstr} onChange={e => setCustomInstr(e.target.value)} rows={2}
                          placeholder="Any specific talking points, things to avoid, or special context..."
                          className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#111827] resize-none placeholder-[#9ca3af]" />
                      </div>
                      <button onClick={generateScript}
                        className="w-full py-2.5 bg-[#111827] hover:bg-[#1f2937] text-white text-sm font-medium rounded-lg transition-colors">
                        🤖 Generate AI Script
                      </button>
                    </div>
                  </div>
                )}

                {/* Phase 3: Script Preview */}
                {scriptLoading && (
                  <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
                    <div className="text-sm text-[#6b7280] mb-3">⚙️ Generating personalized call script...</div>
                    <div className="space-y-3">
                      <div className="h-4 rounded shimmer-bg" style={{ width: '85%' }} />
                      <div className="h-4 rounded shimmer-bg" style={{ width: '70%' }} />
                      <div className="h-4 rounded shimmer-bg" style={{ width: '90%' }} />
                    </div>
                  </div>
                )}

                {scriptReady && callPhase === null && (
                  <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm slide-up">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-[#111827] text-white rounded-full">AI-Generated Call Script</span>
                      <button onClick={() => { setScriptReady(false); setTimeout(generateScript, 100) }} className="text-xs text-[#6b7280] hover:text-[#111827] transition-colors">Regenerate</button>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <div className="text-xs font-semibold text-[#6b7280] mb-1">🎙️ OPENING</div>
                        <p className={`text-[#111827] ${editingScript ? 'border border-[#e5e7eb] rounded p-2' : ''}`}
                          contentEditable={editingScript} suppressContentEditableWarning>
                          Hello, am I speaking with {selected.name}? Great! I'm calling on behalf of CareerBridge regarding your application for the {selected.role} position. Do you have a few minutes to chat?
                        </p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#6b7280] mb-1">📋 SCREENING QUESTIONS</div>
                        <ol className={`list-decimal list-inside space-y-1.5 text-[#111827] ${editingScript ? 'border border-[#e5e7eb] rounded p-2' : ''}`}
                          contentEditable={editingScript} suppressContentEditableWarning>
                          <li>Can you walk me through your experience with {selected.skills[0]} and {selected.skills[1]}?</li>
                          <li>Are you currently available to join within the next 30 days?</li>
                          <li>Are you comfortable with a fully remote work environment?</li>
                          <li>What are your current salary expectations?</li>
                        </ol>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#6b7280] mb-1">🤝 CLOSING</div>
                        <p className={`text-[#111827] ${editingScript ? 'border border-[#e5e7eb] rounded p-2' : ''}`}
                          contentEditable={editingScript} suppressContentEditableWarning>
                          Thank you so much for your time, {selected.name}. We'll follow up within 48 hours with next steps. Have a great day!
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4 text-xs text-[#6b7280]">
                      <span>🕐 Est. call time: ~8 mins</span>
                      <span>📊 Tone: {callTone}</span>
                      <span>🌐 Language: English</span>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setEditingScript(!editingScript)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-[#e5e7eb] text-[#111827] text-sm font-medium rounded-lg hover:bg-[#f9fafb] transition-colors">
                        <Edit3 size={14} /> {editingScript ? 'Done Editing' : 'Edit Script'}
                      </button>
                      <button onClick={initiateCall}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#111827] hover:bg-[#1f2937] text-white text-sm font-medium rounded-lg transition-colors">
                        <Phone size={14} /> Initiate AI Call
                      </button>
                    </div>
                  </div>
                )}

                {/* Phase 4: Live Call Monitor */}
                {callPhase && (
                  <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm slide-up">
                    <div className="text-center mb-4">
                      {callPhase === 'dialing' && (
                        <>
                          <div className="relative w-20 h-20 mx-auto mb-3">
                            <div className="absolute inset-0 rounded-full border-2 border-[#111827] pulse-ring" />
                            <div className="absolute inset-2 rounded-full border-2 border-[#111827] pulse-ring" style={{ animationDelay: '0.3s' }} />
                            <div className="absolute inset-4 rounded-full border-2 border-[#111827] pulse-ring" style={{ animationDelay: '0.6s' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Phone size={24} className="text-[#111827]" />
                            </div>
                          </div>
                          <p className="text-[#111827] font-medium">📞 Connecting to {selected.name}...</p>
                          <p className="text-xs text-[#6b7280]">{selected.phone}</p>
                          <span className="inline-block mt-2 text-xs px-2.5 py-1 bg-[#111827] text-white rounded-full font-medium">DIALING</span>
                          <p className="text-[10px] text-[#9ca3af] mt-2">Call started: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </>
                      )}
                      {callPhase === 'connected' && (
                        <>
                          <div className="relative w-20 h-20 mx-auto mb-3">
                            <div className="absolute inset-0 rounded-full border-4 border-[#16a34a]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <PhoneCall size={24} className="text-[#16a34a]" />
                            </div>
                          </div>
                          <span className="inline-block text-xs px-2.5 py-1 bg-[#16a34a] text-white rounded-full font-medium">🟢 LIVE</span>
                          <p className="text-2xl font-mono font-bold text-[#111827] mt-2">{formatTime(callTimer)}</p>
                        </>
                      )}
                      {callPhase === 'ended' && (
                        <>
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#f0fdf4] flex items-center justify-center check-bounce">
                            <CheckCircle size={32} className="text-[#16a34a]" />
                          </div>
                          <p className="text-[#111827] font-medium">✅ Call Completed · Duration: {formatTime(callTimer)}</p>
                        </>
                      )}
                    </div>

                    {/* Live Transcript */}
                    {(callPhase === 'connected' || callPhase === 'ended') && (
                      <div ref={transcriptRef} className="max-h-48 overflow-y-auto border border-[#e5e7eb] rounded-lg p-3 mb-4 space-y-2 bg-[#f9fafb]">
                        {TRANSCRIPT_LINES.slice(0, callPhase === 'ended' ? TRANSCRIPT_LINES.length : transcriptIdx).map((line, i) => (
                          <div key={i} className="slide-up text-sm">
                            <span className={`font-medium ${line.speaker === 'ai' ? 'text-[#111827]' : 'text-[#6b7280]'}`}>
                              {line.speaker === 'ai' ? '🤖 AI Agent: ' : '👤 Candidate: '}
                            </span>
                            <span className="text-[#111827]">"{line.text}"</span>
                          </div>
                        ))}
                        {callPhase === 'connected' && transcriptIdx < TRANSCRIPT_LINES.length && (
                          <div className="flex gap-1 text-[#9ca3af] text-xs items-center">
                            <span className="dot-blink">●</span> Transcribing...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Intelligence Report */}
                    {callPhase === 'ended' && (
                      <div className="border border-[#e5e7eb] rounded-xl p-5 mt-4 bg-white slide-up">
                        <h4 className="text-sm font-semibold text-[#111827] mb-1 flex items-center gap-2">
                          <BarChart3 size={16} /> AI Call Intelligence Report
                        </h4>
                        <p className="text-xs text-[#6b7280] mb-4">{selected.name} · {selected.role}</p>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-2.5 bg-[#f9fafb] rounded-lg">
                            <div className="text-[10px] text-[#6b7280]">Overall Sentiment</div>
                            <div className="text-sm font-medium text-[#111827]">😊 Positive (87%)</div>
                          </div>
                          <div className="p-2.5 bg-[#f9fafb] rounded-lg">
                            <div className="text-[10px] text-[#6b7280]">Interest Level</div>
                            <div className="text-sm font-medium text-[#111827]">🔥 High</div>
                          </div>
                          <div className="p-2.5 bg-[#f9fafb] rounded-lg">
                            <div className="text-[10px] text-[#6b7280]">Availability</div>
                            <div className="text-sm font-medium text-[#16a34a]">✅ Confirmed (30 days)</div>
                          </div>
                          <div className="p-2.5 bg-[#f9fafb] rounded-lg">
                            <div className="text-[10px] text-[#6b7280]">Salary Aligned</div>
                            <div className="text-sm font-medium text-[#16a34a]">✅ Yes</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs font-semibold text-[#111827] mb-2">Key Highlights</div>
                          <ul className="text-xs text-[#6b7280] space-y-1">
                            <li>• Candidate showed strong enthusiasm</li>
                            <li>• Confirmed {selected.skills.length > 0 ? `experience with ${selected.skills[0]}` : 'relevant experience'}</li>
                            <li>• Available to join immediately</li>
                            <li>• Requested remote-first setup</li>
                          </ul>
                        </div>

                        <div className="text-xs font-semibold text-[#111827] mb-2">Recommended Action</div>
                        <div className="flex flex-wrap gap-2">
                          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#111827] text-white text-xs font-medium rounded-lg hover:bg-[#1f2937] transition-colors">
                            <Calendar size={12} /> Schedule Technical Interview
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-2 border border-[#e5e7eb] text-[#111827] text-xs font-medium rounded-lg hover:bg-[#f9fafb] transition-colors">
                            <MessageSquare size={12} /> Send Follow-up Message
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-2 border border-[#fecaca] text-[#dc2626] text-xs font-medium rounded-lg hover:bg-[#fef2f2] transition-colors">
                            <XCircle size={12} /> Mark as Not Suitable
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 3: Live Activity Feed */}
          <div className="w-72 bg-white border-l border-[#e5e7eb] flex flex-col">
            <div className="p-4 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#111827]">Call Activity</h3>
                <div className="flex items-center gap-1 text-xs text-[#16a34a]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> Live
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {ACTIVITY_FEED.map((a, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    a.status === 'completed' ? 'bg-[#16a34a]' : a.status === 'active' ? 'bg-[#f59e0b]' : 'bg-[#dc2626]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#111827]">{a.name}</div>
                    <div className="text-[#6b7280]">{a.role}</div>
                    <div className={`font-medium mt-0.5 ${
                      a.status === 'completed' ? 'text-[#16a34a]' : a.status === 'active' ? 'text-[#f59e0b]' : 'text-[#dc2626]'
                    }`}>{a.event}</div>
                    <div className="text-[#9ca3af] flex items-center gap-2 mt-0.5">
                      {a.duration !== '—' && <span>{a.duration}</span>}
                      <span>{a.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="px-4 py-3 border-t border-[#e5e7eb] text-[10px] text-[#6b7280] flex justify-between">
              <span>📞 8 Today</span>
              <span>✅ 6 Done</span>
              <span>⚡ 75%</span>
            </div>

            {/* OmniDim Status */}
            <div className="px-4 py-3 border-t border-[#e5e7eb]">
              <div className="flex items-center gap-1.5 text-xs mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                <span className="text-[#111827] font-medium">OmniDim API: Connected</span>
              </div>
              <div className="text-[10px] text-[#9ca3af] space-y-0.5">
                <div>Voice Agent: CareerBridge-Screener-v1</div>
                <div>Model: GPT-4o · Voice: Aria (en-IN)</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ═══ SECTION: CANDIDATE VIEW ═══
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          {/* Card 1: Explainer */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">📞 AI-Assisted Recruiter Calls</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { icon: '🤖', title: 'AI Agent Calls You', desc: 'An AI voice agent will call your registered phone number on behalf of matched recruiters.' },
                { icon: '🎙️', title: 'Conversation Recorded', desc: 'The call is transcribed and analyzed to help recruiters understand your fit for the role.' },
                { icon: '📊', title: 'Report Sent to Recruiter', desc: 'Insights from your call help recruiters make faster and fairer hiring decisions.' },
              ].map(item => (
                <div key={item.title}>
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-sm font-semibold text-[#111827] mb-1">{item.title}</div>
                  <div className="text-xs text-[#6b7280]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Phone Registration */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111827] mb-1">Register Your Phone Number</h2>
            <p className="text-xs text-[#6b7280] mb-4">This number will be used exclusively for recruiter-initiated AI calls through CareerBridge. We will never share it with third parties.</p>

            <div className="space-y-4">
              <div className="flex gap-2">
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                  className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#111827]">
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} {c.country}</option>
                  ))}
                </select>
                <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter your 10-digit number"
                  className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#111827]" />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-[#6b7280] mb-1 block">From</label>
                  <select value={callFrom} onChange={e => setCallFrom(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#111827]">
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#6b7280] mb-1 block">To</label>
                  <select value={callTo} onChange={e => setCallTo(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#111827]">
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-2 block">Days Available</label>
                <div className="flex gap-2">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => setAvailDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${availDays.includes(d) ? 'bg-[#111827] text-white' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-2 block">Language Preference</label>
                <div className="flex gap-3">
                  {['English', 'Hindi', 'Both'].map(l => (
                    <label key={l} className="flex items-center gap-1.5 text-sm text-[#111827] cursor-pointer">
                      <input type="radio" name="lang" checked={language === l} onChange={() => setLanguage(l)} className="accent-[#111827]" /> {l}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Consent */}
          {!consentGranted ? (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">Consent to AI-Assisted Calls</h2>

              <div className="max-h-64 overflow-y-auto border border-[#e5e7eb] rounded-lg p-4 bg-[#f9fafb] text-sm text-[#6b7280] mb-4 space-y-3">
                <p className="font-bold text-[#111827]">CAREERBRIDGE AI CALL CONSENT AGREEMENT</p>
                <p className="text-xs">Last Updated: March 2026</p>
                <div><p className="font-bold text-[#111827]">1. PURPOSE OF CALLS</p><p>By providing consent, you authorize CareerBridge AI and its verified recruiter partners to contact you via AI-powered voice calls. These calls are conducted by our voice agent system ("CareerBridge Caller") for recruitment screening, interview scheduling, and opportunity discussion purposes only.</p></div>
                <div><p className="font-bold text-[#111827]">2. RECORDING & TRANSCRIPTION</p><p>All AI-initiated calls may be recorded and transcribed. Transcripts are used solely for generating candidate-recruiter match insights. Recordings are stored securely and deleted after 90 days unless legally required otherwise.</p></div>
                <div><p className="font-bold text-[#111827]">3. DATA USAGE</p><p>Your phone number will be used exclusively for calls initiated through the CareerBridge platform by recruiters you have matched with. We do not sell, rent, or share your phone number with any third party.</p></div>
                <div><p className="font-bold text-[#111827]">4. OPT-OUT RIGHTS</p><p>You may revoke this consent at any time from your Privacy Settings. Revoking consent immediately disables all future AI-assisted calls. Existing match notifications will switch to in-app messaging only.</p></div>
                <div><p className="font-bold text-[#111827]">5. CALL FREQUENCY</p><p>Recruiters may initiate a maximum of 2 AI calls per active job application. You will receive an in-app notification before any call is placed.</p></div>
                <div><p className="font-bold text-[#111827]">6. TECHNOLOGY PARTNER</p><p>AI calling infrastructure is powered by OmniDimension (omnidim.io). Their platform processes voice data under their own privacy policy, which we encourage you to review at omnidim.io/privacy.</p></div>
              </div>

              <div className="space-y-3 mb-4">
                {[
                  'I have read and understood the CareerBridge AI Call Consent Agreement',
                  'I consent to being contacted via AI-assisted voice calls for recruitment purposes',
                  'I understand my calls will be recorded and transcribed as described above',
                ].map((label, i) => (
                  <label key={i} className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={checks[i]} onChange={() => setChecks(prev => prev.map((c, j) => j === i ? !c : c))}
                      className="mt-0.5 accent-[#111827] w-4 h-4" />
                    <span className="text-sm text-[#111827]">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 py-2">
                <span className="text-sm text-[#111827]">Enable AI Call Notifications (recommended)</span>
                <button onClick={() => setNotifications(!notifications)}
                  className={`w-10 h-5 rounded-full transition-colors ${notifications ? 'bg-[#111827]' : 'bg-[#d1d5db]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${notifications ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <button onClick={() => allChecked && setConsentGranted(true)} disabled={!allChecked}
                className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${allChecked ? 'bg-[#111827] text-white hover:bg-[#1f2937] cursor-pointer' : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'}`}>
                ✅ Grant Consent & Register Number
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0fdf4] flex items-center justify-center check-bounce">
                <CheckCircle size={36} className="text-[#16a34a]" />
              </div>
              <h3 className="text-lg font-semibold text-[#111827] mb-1">🎉 You're all set, Aarav!</h3>
              <p className="text-sm text-[#6b7280] mb-4">Your number has been registered. Recruiters with 90%+ match scores can now reach you via AI-assisted calls during your preferred hours.</p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <span className="text-xs px-3 py-1 bg-[#f3f4f6] rounded-full text-[#111827]">📞 {countryCode} ••••••{phoneNumber.slice(-4)}</span>
                <span className="text-xs px-3 py-1 bg-[#f3f4f6] rounded-full text-[#111827]">🕐 {callFrom} – {callTo}</span>
                <span className="text-xs px-3 py-1 bg-[#f3f4f6] rounded-full text-[#111827]">📅 {availDays.join(', ')}</span>
                <span className="text-xs px-3 py-1 bg-[#f3f4f6] rounded-full text-[#111827]">🌐 {language}</span>
              </div>
              <button className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors underline">Manage Consent Settings</button>
            </div>
          )}

          {/* Revoke Section */}
          {!consentRevoked && (
            <div className="border border-[#fecaca] bg-[#fef2f2] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#dc2626] mb-1">⚠️ Revoke Consent</h3>
              <p className="text-xs text-[#6b7280] mb-3">Revoking consent will immediately stop all AI-assisted calls. Recruiters will be notified to use in-app messaging instead.</p>
              <button onClick={() => { setConsentRevoked(true); setConsentGranted(false) }}
                className="px-4 py-2 border border-[#dc2626] text-[#dc2626] text-sm font-medium rounded-lg bg-white hover:bg-[#fef2f2] transition-colors">
                Revoke Call Consent
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

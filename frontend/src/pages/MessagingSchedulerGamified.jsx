import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Paperclip, Mic, Smile, Calendar, Video, Phone, MapPin, Copy, Check, CheckCheck, Clock, X, Award, Flame, Lock, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateICS, downloadICS, generateMeetingLink } from '../utils/calendarUtils'

// ═══ SECTION: XP LEVELS & BADGE DEFINITIONS ═══
const XP_LEVELS = [
  { min: 0, max: 199, name: 'Fresher', emoji: '🌱', color: 'bg-gray-500' },
  { min: 200, max: 499, name: 'Intern', emoji: '🎓', color: 'bg-blue-500' },
  { min: 500, max: 999, name: 'Junior Dev', emoji: '💻', color: 'bg-green-500' },
  { min: 1000, max: 1999, name: 'Mid-level', emoji: '⚡', color: 'bg-yellow-500' },
  { min: 2000, max: 3999, name: 'Senior Dev', emoji: '🚀', color: 'bg-orange-500' },
  { min: 4000, max: 7999, name: 'Tech Lead', emoji: '🏆', color: 'bg-purple-500' },
  { min: 8000, max: Infinity, name: 'CTO', emoji: '👑', color: 'bg-yellow-400' },
]

const BADGE_DEFS = [
  { id: 'sharp_shooter', name: 'Sharp Shooter', icon: '🎯', condition: 'Schedule first meeting', xp: 50 },
  { id: 'conversation_pro', name: 'Conversation Pro', icon: '💬', condition: 'Send 5 total messages', xp: 75 },
  { id: 'speed_networker', name: 'Speed Networker', icon: '⚡', condition: 'Send 3 messages in one chat', xp: 60 },
  { id: 'deal_maker', name: 'Deal Maker', icon: '🤝', condition: 'Mark a meeting as complete', xp: 100 },
  { id: 'ghost_protocol', name: 'Ghost Protocol', icon: '👁️', condition: 'Open all 3 conversations', xp: 40 },
  { id: 'rising_star', name: 'Rising Star', icon: '⭐', condition: 'Reach 500 XP total', xp: 0 },
]

const EMOJIS = ['😊', '👍', '🎉', '🔥', '💯', '🤝', '✨', '👏']

function getLevel(xp) {
  return XP_LEVELS.find(l => xp >= l.min && xp <= l.max) || XP_LEVELS[0]
}

function getNextLevel(xp) {
  const idx = XP_LEVELS.findIndex(l => xp >= l.min && xp <= l.max)
  return idx < XP_LEVELS.length - 1 ? XP_LEVELS[idx + 1] : null
}

function getLevelProgress(xp) {
  const level = getLevel(xp)
  const range = level.max === Infinity ? 4000 : level.max - level.min + 1
  return ((xp - level.min) / range) * 100
}

// ═══ SECTION: MOCK DATA ═══
const initConversations = () => [
  {
    id: 1, name: 'Aarav Shah', role: 'React Developer', online: true, unread: 2,
    avatar: 'AS', openedOnce: false, msgCount: 0,
    messages: [
      { id: 1, text: "Hi Aarav, we reviewed your React portfolio and we're impressed with your component architecture.", sent: false, time: '10:15 AM', read: true },
      { id: 2, text: "Thank you! I really enjoyed building that state management system from scratch.", sent: true, time: '10:18 AM', read: true },
      { id: 3, text: "Could you walk us through how you handled the real-time data sync in your dashboard project?", sent: false, time: '10:20 AM', read: true },
      { id: 4, text: "Sure! I used WebSocket with a custom reconnection strategy and optimistic UI updates. Happy to do a deep dive in a call.", sent: true, time: '10:22 AM', read: true },
      { id: 5, text: "Perfect. Let's schedule a technical round. Are you available this week?", sent: false, time: '10:25 AM', read: false },
    ]
  },
  {
    id: 2, name: 'Priya Nair', role: 'Data Scientist', online: true, unread: 1,
    avatar: 'PN', openedOnce: false, msgCount: 0,
    messages: [
      { id: 1, text: "Hi Priya, your ML pipeline work at DataCorp caught our attention. We have a senior DS role open.", sent: false, time: '9:30 AM', read: true },
      { id: 2, text: "That sounds exciting! I've been looking for a role with more production ML focus.", sent: true, time: '9:45 AM', read: true },
      { id: 3, text: "Great fit then. Our team deploys 20+ models weekly. Can we set up a technical discussion?", sent: false, time: '9:50 AM', read: false },
    ]
  },
  {
    id: 3, name: 'Rohan Mehta', role: 'Product Manager', online: false, unread: 0,
    avatar: 'RM', openedOnce: false, msgCount: 0,
    messages: [
      { id: 1, text: "Rohan, your experience at scaling B2B SaaS products aligns well with our PM opening.", sent: false, time: 'Yesterday', read: true },
      { id: 2, text: "I'd love to learn more about the product roadmap and team structure.", sent: true, time: 'Yesterday', read: true },
    ]
  }
]

const AUTO_REPLIES = {
  1: ["That works for me! I'm free Wednesday and Thursday afternoon.", "Also, should I prepare anything specific for the technical round?", "Looking forward to it! 🚀"],
  2: ["Absolutely! I can share my recent research paper on transformer-based anomaly detection.", "Would a 45-minute slot work?", "Great, let me know the time."],
  3: ["That sounds great. I have some questions about the go-to-market strategy too.", "Can we do a video call?", "Thanks for considering me!"],
}

export default function MessagingSchedulerGamified() {
  // ═══ SECTION: STATE ═══
  const [conversations, setConversations] = useState(initConversations)
  const [activeChat, setActiveChat] = useState(null)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [replyIdx, setReplyIdx] = useState({1: 0, 2: 0, 3: 0})
  
  // Scheduler
  const [showScheduler, setShowScheduler] = useState(false)
  const [schedStep, setSchedStep] = useState(0)
  const [meetType, setMeetType] = useState(null)
  const [meetDate, setMeetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })
  const [meetTime, setMeetTime] = useState('10:00')
  const [meetDuration, setMeetDuration] = useState(45)
  const [meetTitle, setMeetTitle] = useState('')
  const [meetAgenda, setMeetAgenda] = useState('')
  const [calInvite, setCalInvite] = useState(true)
  const [reminder, setReminder] = useState(true)
  const [meetLink] = useState(generateMeetingLink('jitsi'))
  const [copied, setCopied] = useState(false)
  
  // Gamification
  const [xp, setXp] = useState(340)
  const [toasts, setToasts] = useState([])
  const [levelUp, setLevelUp] = useState(null)
  const [badges, setBadges] = useState({})
  const [totalMsgsSent, setTotalMsgsSent] = useState(0)
  const [meetingsScheduled, setMeetingsScheduled] = useState(0)
  const [meetingsCompleted, setMeetingsCompleted] = useState(0)
  const [openedChats, setOpenedChats] = useState(new Set())
  const [msgPerChat, setMsgPerChat] = useState({})
  
  const chatEndRef = useRef(null)
  const toastIdRef = useRef(0)
  
  // Booked time slots (random)
  const [bookedSlots] = useState(() => {
    const slots = ['9:30 AM', '11:00 AM', '1:00 PM', '3:30 PM', '5:00 PM']
    return slots.sort(() => Math.random() - 0.5).slice(0, 4)
  })

  // ═══ SECTION: XP ENGINE ═══
  const addXp = useCallback((amount, label) => {
    setXp(prev => {
      const newXp = prev + amount
      const prevLevel = getLevel(prev)
      const newLevel = getLevel(newXp)
      if (newLevel.name !== prevLevel.name) {
        setLevelUp(newLevel)
        setTimeout(() => setLevelUp(null), 3000)
      }
      return newXp
    })

    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, text: `+${amount} XP · ${label}`, ts: Date.now() }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500)
  }, [])

  // Badge checking
  useEffect(() => {
    const newBadges = { ...badges }
    let badgeXpToAdd = 0
    const unlockBadge = (id) => {
      if (!newBadges[id]) {
        newBadges[id] = new Date().toLocaleTimeString()
        const def = BADGE_DEFS.find(b => b.id === id)
        if (def) {
          badgeXpToAdd += def.xp
          const tid = ++toastIdRef.current
          setToasts(prev => [...prev, { id: tid, text: `🏅 Badge Unlocked: ${def.name}!`, ts: Date.now() }])
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), 2500)
        }
      }
    }
    
    if (meetingsScheduled > 0) unlockBadge('sharp_shooter')
    if (totalMsgsSent >= 5) unlockBadge('conversation_pro')
    if (Object.values(msgPerChat).some(c => c >= 3)) unlockBadge('speed_networker')
    if (meetingsCompleted > 0) unlockBadge('deal_maker')
    if (openedChats.size >= 3) unlockBadge('ghost_protocol')
    if (xp >= 500) unlockBadge('rising_star')
    
    if (JSON.stringify(newBadges) !== JSON.stringify(badges)) {
      setBadges(newBadges)
      if (badgeXpToAdd > 0) setXp(prev => prev + badgeXpToAdd)
    }
  }, [totalMsgsSent, meetingsScheduled, meetingsCompleted, openedChats, msgPerChat, xp, badges])

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat, conversations, typing])

  const activeConv = conversations.find(c => c.id === activeChat)

  // ═══ SECTION: MESSAGING ═══
  function selectChat(id) {
    setActiveChat(id)
    setShowEmoji(false)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
    setOpenedChats(prev => new Set([...prev, id]))
  }

  function sendMessage() {
    if (!input.trim() || !activeChat) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newMsg = { id: Date.now(), text: input.trim(), sent: true, time: now, read: false }
    
    setConversations(prev => prev.map(c => 
      c.id === activeChat ? { ...c, messages: [...c.messages, newMsg], msgCount: c.msgCount + 1 } : c
    ))
    setInput('')
    setShowEmoji(false)
    setTotalMsgsSent(prev => prev + 1)
    setMsgPerChat(prev => ({ ...prev, [activeChat]: (prev[activeChat] || 0) + 1 }))
    addXp(10, 'Message Sent 💬')
    
    // Simulate typing then auto-reply
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const replies = AUTO_REPLIES[activeChat] || ["Thanks for the message!"]
      const idx = replyIdx[activeChat] || 0
      const replyText = replies[idx % replies.length]
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      
      setConversations(prev => prev.map(c => 
        c.id === activeChat ? {
          ...c,
          messages: [...c.messages, { id: Date.now() + 1, text: replyText, sent: false, time: replyTime, read: true }]
        } : c
      ))
      setReplyIdx(prev => ({ ...prev, [activeChat]: (prev[activeChat] || 0) + 1 }))
    }, 2000)
  }

  // ═══ SECTION: SCHEDULER ═══
  function openScheduler() {
    setShowScheduler(true)
    setSchedStep(0)
    setMeetType(null)
    setMeetDate(null)
    setMeetTime(null)
    setMeetDuration(45)
    setMeetTitle(activeConv ? `Interview – ${activeConv.name} × CareerBridge` : '')
    setMeetAgenda('')
    setCalInvite(true)
    setReminder(true)
    setCopied(false)
  }

  function getDays() {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        key: i
      })
    }
    return days
  }

  function getTimeSlots() {
    const slots = []
    for (let h = 9; h <= 17; h++) {
      slots.push(`${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`)
      slots.push(`${h > 12 ? h - 12 : h}:30 ${h >= 12 ? 'PM' : 'AM'}`)
    }
    return slots
  }

  function sendMeetToChat() {
    if (!activeChat) return
    const day = getDays().find(d => d.key === meetDate)
    const typeIcon = meetType === 'video' ? '📹' : meetType === 'phone' ? '📞' : '🏢'
    const typeLabel = meetType === 'video' ? 'Video Call' : meetType === 'phone' ? 'Phone Call' : 'In-Person'
    
    const meetingCard = {
      id: Date.now(),
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      isMeeting: true,
      meetingData: {
        title: meetTitle || `Interview – ${activeConv?.name}`,
        date: day?.full || 'TBD',
        time: meetTime || 'TBD',
        duration: meetDuration,
        type: typeLabel,
        typeIcon,
        link: `careerbridge.meet/${meetLink}`,
        completed: false,
      }
    }
    
    setConversations(prev => prev.map(c =>
      c.id === activeChat ? { ...c, messages: [...c.messages, meetingCard] } : c
    ))
    setShowScheduler(false)
    setMeetingsScheduled(prev => prev + 1)
    addXp(100, 'Meeting Scheduled 📅')
  }

  function markMeetingComplete(chatId, msgId) {
    setConversations(prev => prev.map(c =>
      c.id === chatId ? {
        ...c,
        messages: c.messages.map(m =>
          m.id === msgId && m.isMeeting ? { ...m, meetingData: { ...m.meetingData, completed: true } } : m
        )
      } : c
    ))
    setMeetingsCompleted(prev => prev + 1)
    addXp(150, 'Meeting Completed ✅')
  }

  const currentLevel = getLevel(xp)
  const nextLevel = getNextLevel(xp)
  const progress = getLevelProgress(xp)
  const xpToNext = nextLevel ? nextLevel.min - xp : 0

  // ═══ SECTION: RENDER ═══
  return (
    <div className="min-h-screen" style={{ background: '#0f172a' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes toast-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes toast-out { from { opacity: 1; } to { opacity: 0; transform: translateY(-10px); } }
        @keyframes level-glow { 0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.7); } }
        @keyframes check-scale { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes badge-flip { 0% { transform: rotateY(0deg); } 50% { transform: rotateY(90deg); } 100% { transform: rotateY(0deg); } }
        @keyframes flame-pulse { 0%, 100% { text-shadow: 0 0 8px rgba(251,146,60,0.5); } 50% { text-shadow: 0 0 16px rgba(251,146,60,0.9); } }
        @keyframes slide-right { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .typing-dot { animation: pulse-dot 1.2s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .toast-anim { animation: toast-in 0.3s ease-out; }
        .level-glow { animation: level-glow 1.5s ease-in-out infinite; }
        .check-anim { animation: check-scale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .badge-unlock { animation: badge-flip 0.6s ease-in-out; }
        .flame-glow { animation: flame-pulse 2s ease-in-out infinite; }
        .slide-step { animation: slide-right 0.3s ease-out; }
      `}} />

      <div className="flex h-[calc(100vh-56px)]">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className="w-80 border-r border-white/5 flex flex-col" style={{ background: '#0f172a' }}>
          {/* XP Panel */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">AS</div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold">Aarav Shah</div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full text-white ${currentLevel.color}`}>
                    {currentLevel.emoji} {currentLevel.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="mb-1">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{xp} XP</span>
                <span>{nextLevel ? `${nextLevel.min} XP` : 'MAX'}</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {nextLevel ? `${xpToNext} XP to ${nextLevel.emoji} ${nextLevel.name}` : '🎉 Max level!'}
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {BADGE_DEFS.map(b => {
                const unlocked = !!badges[b.id]
                return (
                  <div key={b.id} className={`relative group shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg cursor-pointer transition-all ${unlocked ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-[#0f172a] badge-unlock' : 'bg-gray-800 grayscale opacity-50'}`}
                    title={unlocked ? `${b.name} — Unlocked at ${badges[b.id]}` : `🔒 ${b.condition}`}>
                    {b.icon}
                    {!unlocked && <span className="absolute -bottom-0.5 -right-0.5 text-[8px]">🔒</span>}
                  </div>
                )
              })}
            </div>

            {/* Streak */}
            <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-800/50 text-xs text-gray-400">
              <span className="flame-glow text-base">🔥</span>
              <span>3-Day Streak · <span className="text-gray-300">Keep it up!</span></span>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map(c => (
              <div key={c.id} onClick={() => selectChat(c.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/5 transition-colors ${activeChat === c.id ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-white/5'}`}>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">{c.avatar}</div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f172a] ${c.online ? 'bg-green-400' : 'bg-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium truncate">{c.name}</span>
                    {c.unread > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">{c.unread}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {c.messages[c.messages.length - 1]?.text?.substring(0, 40) || 'No messages'}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CHAT PANEL ═══ */}
        <div className="flex-1 flex flex-col" style={{ background: '#0f172a' }}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <MessageSquare size={48} className="mb-3 opacity-30" />
              <div className="text-lg font-medium">Select a conversation</div>
              <div className="text-sm">Choose from the sidebar to start chatting</div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">{activeConv.avatar}</div>
                  <div>
                    <div className="text-white text-sm font-semibold">{activeConv.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span>{activeConv.role}</span>
                      <span>·</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${activeConv.online ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span>{activeConv.online ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={openScheduler} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors">
                  <Calendar size={14} /> Schedule Meet
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {activeConv.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                    {msg.isMeeting ? (
                      <div className={`max-w-sm rounded-xl p-4 border ${msg.sent ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-gray-800 border-white/10'}`}>
                        <div className="text-sm font-semibold text-white mb-2">📅 Meeting Scheduled</div>
                        <div className="text-white text-sm font-medium mb-1">{msg.meetingData.title}</div>
                        <div className="text-xs text-gray-300 space-y-1">
                          <div>📆 {msg.meetingData.date} · {msg.meetingData.time}</div>
                          <div>⏱ {msg.meetingData.duration} minutes · {msg.meetingData.type}</div>
                          <div>🔗 {msg.meetingData.link}</div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors">Join Meeting</button>
                          {!msg.meetingData.completed ? (
                            <button onClick={(e) => { e.stopPropagation(); markMeetingComplete(activeChat, msg.id) }}
                              className="flex-1 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-medium rounded-lg transition-colors border border-green-500/30">
                              ✓ Mark Complete
                            </button>
                          ) : (
                            <span className="flex-1 py-1.5 text-center text-green-400 text-xs font-medium">✅ Completed</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl ${msg.sent ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-gray-100'}`}>
                        <div className="text-sm leading-relaxed">{msg.text}</div>
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${msg.sent ? 'text-indigo-200' : 'text-gray-400'}`}>
                          <span>{msg.time}</span>
                          {msg.sent && (msg.read ? <CheckCheck size={12} /> : <Check size={12} />)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Typing indicator */}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-2xl px-4 py-3 flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Bar */}
              <div className="px-6 py-3 border-t border-white/5">
                {/* Emoji picker */}
                {showEmoji && (
                  <div className="flex gap-2 mb-2 p-2 bg-gray-800 rounded-lg">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setInput(prev => prev + e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors"><Paperclip size={18} /></button>
                  <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 text-gray-400 hover:text-white transition-colors"><Smile size={18} /></button>
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors" />
                  <button className="p-2 text-gray-400 hover:text-white transition-colors"><Mic size={18} /></button>
                  <button onClick={sendMessage}
                    className="p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ SCHEDULER MODAL ═══ */}
      {showScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowScheduler(false)}>
          <div className="bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Schedule Meeting</h3>
              <button onClick={() => setShowScheduler(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 px-6 py-4">
              {['Type', 'Time', 'Details', 'Confirm'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < schedStep ? 'bg-indigo-500 text-white' : i === schedStep ? 'bg-indigo-500 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#1e293b]' : 'bg-gray-700 text-gray-400'}`}>
                    {i < schedStep ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i === schedStep ? 'text-white' : 'text-gray-500'}`}>{s}</span>
                  {i < 3 && <ChevronRight size={14} className="text-gray-600 mx-1" />}
                </div>
              ))}
            </div>

            <div className="px-6 pb-6 slide-step" key={schedStep}>
              {/* Step 1: Meeting Type */}
              {schedStep === 0 && (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm mb-4">Choose meeting format</p>
                  {[
                    { key: 'video', icon: '📹', title: 'Video Interview', desc: 'Google Meet link auto-generated' },
                    { key: 'phone', icon: '📞', title: 'Phone Call', desc: 'Share your number or use platform call' },
                    { key: 'inperson', icon: '🏢', title: 'In-Person', desc: 'Add location/address' },
                  ].map(t => (
                    <div key={t.key} onClick={() => setMeetType(t.key)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${meetType === t.key ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20' : 'border-white/10 hover:border-white/20'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.icon}</span>
                        <div>
                          <div className="text-white text-sm font-medium">{t.title}</div>
                          <div className="text-gray-400 text-xs">{t.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => meetType && setSchedStep(1)} disabled={!meetType}
                    className="w-full mt-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors">
                    Next
                  </button>
                </div>
              )}

              {/* Step 2: Date & Time */}
              {schedStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">Select Date</label>
                    <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">Select Time</label>
                    <input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">Duration</label>
                    <div className="flex gap-2">
                      {[30, 45, 60].map(d => (
                        <button key={d} onClick={() => setMeetDuration(d)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${meetDuration === d ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSchedStep(0)} className="flex-1 py-2.5 bg-gray-700 text-white text-sm font-medium rounded-xl hover:bg-gray-600 transition-colors">Back</button>
                    <button onClick={() => meetDate && meetTime && setSchedStep(2)} disabled={!meetDate || !meetTime}
                      className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors">Next</button>
                  </div>
                </div>
              )}

              {/* Step 3: Details */}
              {schedStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Title</label>
                    <input value={meetTitle} onChange={e => setMeetTitle(e.target.value)}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Agenda</label>
                    <textarea value={meetAgenda} onChange={e => setMeetAgenda(e.target.value)} rows={3}
                      placeholder="Meeting agenda..."
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Send calendar invite to both parties</span>
                      <button onClick={() => setCalInvite(!calInvite)}
                        className={`w-10 h-5 rounded-full transition-colors ${calInvite ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${calInvite ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Send reminder 30 mins before</span>
                      <button onClick={() => setReminder(!reminder)}
                        className={`w-10 h-5 rounded-full transition-colors ${reminder ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${reminder ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Meeting Link</label>
                    <div className="flex items-center gap-2 bg-gray-800 border border-white/10 rounded-xl px-3 py-2">
                      <span className="text-sm text-gray-300 flex-1 break-all">{meetLink}</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText(meetLink)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1500)
                      }}
                        className="text-gray-400 hover:text-white transition-colors shrink-0">
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Download Calendar File Button */}
                  <button onClick={() => {
                    if (meetDate && meetTime && meetTitle) {
                      const icsContent = generateICS({
                        title: meetTitle,
                        description: meetAgenda || 'Meeting scheduled via CareerBridge',
                        start: new Date(`${meetDate}T${meetTime}`),
                        duration: meetDuration,
                        location: meetLink,
                      })
                      downloadICS(`meeting-${meetDate}.ics`, icsContent)
                      toast.success('Calendar file downloaded!')
                    }
                  }}
                    className="w-full py-2 px-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl text-sm text-green-400 transition-colors font-medium">
                    📥 Download Calendar (.ics)
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => setSchedStep(1)} className="flex-1 py-2.5 bg-gray-700 text-white text-sm font-medium rounded-xl hover:bg-gray-600 transition-colors">Back</button>
                    <button onClick={() => setSchedStep(3)} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors">Next</button>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {schedStep === 3 && (
                <div className="text-center space-y-4">
                  <div className="check-anim inline-flex w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mx-auto">
                    <Check size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-white text-lg font-bold">Meeting Ready!</h3>
                  <div className="bg-gray-800 rounded-xl p-4 text-left space-y-2">
                    <div className="text-sm text-white font-medium">{meetTitle}</div>
                    <div className="text-xs text-gray-400">📆 {getDays().find(d => d.key === meetDate)?.full} · {meetTime}</div>
                    <div className="text-xs text-gray-400">⏱ {meetDuration} minutes · {meetType === 'video' ? 'Video Call' : meetType === 'phone' ? 'Phone Call' : 'In-Person'}</div>
                    <div className="text-xs text-gray-400">🔗 careerbridge.meet/{meetLink}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 bg-gray-700 text-white text-sm font-medium rounded-xl hover:bg-gray-600 transition-colors">Add to Calendar</button>
                    <button onClick={sendMeetToChat} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors">Send to Chat</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ XP TOASTS ═══ */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className="toast-anim bg-indigo-500 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium">
            {t.text}
          </div>
        ))}
      </div>

      {/* ═══ LEVEL UP OVERLAY ═══ */}
      {levelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="level-glow bg-[#1e293b] rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-white text-2xl font-bold mb-2">LEVEL UP!</h2>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`text-lg px-3 py-1 rounded-full text-white ${levelUp.color}`}>
                {levelUp.emoji} {levelUp.name}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Keep going! 🚀</p>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Smile, Calendar, Video, Phone, Copy, Check, CheckCheck, Clock, X, ChevronRight, MessageSquare, Search, MoreVertical, User, Mail, Briefcase, ExternalLink, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateICS, downloadICS, generateMeetingLink } from '../utils/calendarUtils'

const EMOJIS = ['😊', '👍', '🎉', '🔥', '💯', '🤝', '✨', '👏', '😄', '🙌', '💪', '🎯']

const CANDIDATE_INFO = {
  1: { email: 'aarav.shah@gmail.com', phone: '+91 98765 43210', location: 'Mumbai, India', appliedFor: 'Senior React Developer', experience: '4 years', skills: ['React', 'TypeScript', 'Node.js', 'WebSocket'], matchScore: 92 },
  2: { email: 'priya.nair@gmail.com', phone: '+91 87654 32109', location: 'Bangalore, India', appliedFor: 'Senior Data Scientist', experience: '5 years', skills: ['Python', 'TensorFlow', 'MLOps', 'SQL'], matchScore: 88 },
  3: { email: 'rohan.mehta@gmail.com', phone: '+91 76543 21098', location: 'Delhi, India', appliedFor: 'Product Manager', experience: '6 years', skills: ['Strategy', 'Analytics', 'Agile', 'SQL'], matchScore: 85 },
}

const initConversations = () => [
  {
    id: 1, name: 'Aarav Shah', role: 'React Developer', online: true, unread: 2,
    avatar: 'AS', lastActive: 'now',
    messages: [
      { id: 1, text: "Hi Aarav, we reviewed your React portfolio and we're impressed with your component architecture.", sent: true, time: '10:15 AM', read: true },
      { id: 2, text: "Thank you! I really enjoyed building that state management system from scratch.", sent: false, time: '10:18 AM', read: true },
      { id: 3, text: "Could you walk us through how you handled the real-time data sync in your dashboard project?", sent: true, time: '10:20 AM', read: true },
      { id: 4, text: "Sure! I used WebSocket with a custom reconnection strategy and optimistic UI updates. Happy to do a deep dive in a call.", sent: false, time: '10:22 AM', read: true },
      { id: 5, text: "Perfect. Let's schedule a technical round. Are you available this week?", sent: true, time: '10:25 AM', read: false },
    ]
  },
  {
    id: 2, name: 'Priya Nair', role: 'Data Scientist', online: true, unread: 1,
    avatar: 'PN', lastActive: 'now',
    messages: [
      { id: 1, text: "Hi Priya, your ML pipeline work at DataCorp caught our attention. We have a senior DS role open.", sent: true, time: '9:30 AM', read: true },
      { id: 2, text: "That sounds exciting! I've been looking for a role with more production ML focus.", sent: false, time: '9:45 AM', read: true },
      { id: 3, text: "Great fit then. Our team deploys 20+ models weekly. Can we set up a technical discussion?", sent: true, time: '9:50 AM', read: false },
    ]
  },
  {
    id: 3, name: 'Rohan Mehta', role: 'Product Manager', online: false, unread: 0,
    avatar: 'RM', lastActive: '2h ago',
    messages: [
      { id: 1, text: "Rohan, your experience at scaling B2B SaaS products aligns well with our PM opening.", sent: true, time: 'Yesterday', read: true },
      { id: 2, text: "I'd love to learn more about the product roadmap and team structure.", sent: false, time: 'Yesterday', read: true },
    ]
  }
]

const AUTO_REPLIES = {
  1: ["That works for me! I'm free Wednesday and Thursday afternoon.", "Also, should I prepare anything specific for the technical round?", "Looking forward to it!"],
  2: ["Absolutely! I can share my recent research paper on transformer-based anomaly detection.", "Would a 45-minute slot work?", "Great, let me know the time."],
  3: ["That sounds great. I have some questions about the go-to-market strategy too.", "Can we do a video call?", "Thanks for considering me!"],
}

const AVATAR_COLORS = {
  1: 'from-violet-500 to-purple-600',
  2: 'from-emerald-500 to-teal-600',
  3: 'from-amber-500 to-orange-600',
}

export default function MessagingSchedulerGamified() {
  const [conversations, setConversations] = useState(initConversations)
  const [activeChat, setActiveChat] = useState(null)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replyIdx, setReplyIdx] = useState({ 1: 0, 2: 0, 3: 0 })

  // Scheduler
  const [showScheduler, setShowScheduler] = useState(false)
  const [schedStep, setSchedStep] = useState(0)
  const [meetType, setMeetType] = useState(null)
  const [meetDate, setMeetDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [meetTime, setMeetTime] = useState('10:00')
  const [meetDuration, setMeetDuration] = useState(45)
  const [meetTitle, setMeetTitle] = useState('')
  const [meetAgenda, setMeetAgenda] = useState('')
  const [calInvite, setCalInvite] = useState(true)
  const [reminder, setReminder] = useState(true)
  const [meetLink] = useState(generateMeetingLink('jitsi'))
  const [copied, setCopied] = useState(false)

  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat, conversations, typing])

  const activeConv = conversations.find(c => c.id === activeChat)
  const candidateInfo = activeChat ? CANDIDATE_INFO[activeChat] : null

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  function selectChat(id) {
    setActiveChat(id)
    setShowEmoji(false)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }

  function sendMessage() {
    if (!input.trim() || !activeChat) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newMsg = { id: Date.now(), text: input.trim(), sent: true, time: now, read: false }

    setConversations(prev => prev.map(c =>
      c.id === activeChat ? { ...c, messages: [...c.messages, newMsg] } : c
    ))
    setInput('')
    setShowEmoji(false)

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
    }, 1800)
  }

  function openScheduler() {
    setShowScheduler(true)
    setSchedStep(0)
    setMeetType(null)
    setMeetDate(() => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return d.toISOString().split('T')[0]
    })
    setMeetTime('10:00')
    setMeetDuration(45)
    setMeetTitle(activeConv ? `Interview - ${activeConv.name}` : '')
    setMeetAgenda('')
    setCalInvite(true)
    setReminder(true)
    setCopied(false)
  }

  function sendMeetToChat() {
    if (!activeChat) return
    const typeLabel = meetType === 'video' ? 'Video Call' : meetType === 'phone' ? 'Phone Call' : 'In-Person'

    const meetingCard = {
      id: Date.now(),
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      isMeeting: true,
      meetingData: {
        title: meetTitle || `Interview - ${activeConv?.name}`,
        date: meetDate,
        time: meetTime,
        duration: meetDuration,
        type: typeLabel,
        link: meetLink,
        completed: false,
      }
    }

    setConversations(prev => prev.map(c =>
      c.id === activeChat ? { ...c, messages: [...c.messages, meetingCard] } : c
    ))
    setShowScheduler(false)
    toast.success('Meeting scheduled successfully!')
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
    toast.success('Meeting marked as complete!')
  }

  const scheduledMeetings = activeConv?.messages.filter(m => m.isMeeting) || []

  return (
    <div className="min-h-screen bg-surface-900">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes slide-right { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .typing-dot { animation: pulse-dot 1.2s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .slide-step { animation: slide-right 0.3s ease-out; }
        .msg-scrollbar::-webkit-scrollbar { width: 4px; }
        .msg-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .msg-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .msg-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />

      <div className="flex h-[calc(100vh-56px)]">

        {/* LEFT SIDEBAR - Conversations */}
        <div className="w-[320px] border-r border-white/5 flex flex-col bg-surface-800/50">
          {/* Header */}
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-display font-bold text-foreground">Messages</h1>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold">{totalUnread}</span>
                )}
              </div>
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-surface-700/50 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto msg-scrollbar px-2">
            {filteredConversations.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => selectChat(c.id)}
                className={`flex items-center gap-3 px-3 py-3 mx-1 mb-0.5 cursor-pointer rounded-xl transition-all duration-200 ${
                  activeChat === c.id
                    ? 'bg-brand-500/8 border border-brand-500/20'
                    : 'hover:bg-surface-700/40 border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_COLORS[c.id]} flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-black/20`}>
                    {c.avatar}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-surface-800 ${c.online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-foreground text-sm font-semibold truncate">{c.name}</span>
                    <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                      {c.messages[c.messages.length - 1]?.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 truncate pr-2">
                      {c.messages[c.messages.length - 1]?.sent && <span className="text-gray-500">You: </span>}
                      {c.messages[c.messages.length - 1]?.text?.substring(0, 35) || 'No messages'}
                    </div>
                    {c.unread > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">{c.unread}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CENTER - Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-surface-800 border border-white/5 flex items-center justify-center mb-5">
                <MessageSquare size={32} className="text-gray-600" />
              </div>
              <h2 className="text-foreground font-display font-semibold text-lg mb-1">Your Messages</h2>
              <p className="text-gray-500 text-sm">Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-surface-800/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[activeConv.id]} flex items-center justify-center text-white text-xs font-bold`}>
                    {activeConv.avatar}
                  </div>
                  <div>
                    <div className="text-foreground text-sm font-semibold">{activeConv.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span>{activeConv.role}</span>
                      <span className="text-gray-600">|</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${activeConv.online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                      <span>{activeConv.online ? 'Active now' : `Last seen ${activeConv.lastActive}`}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-gray-400 hover:text-foreground hover:bg-surface-700 rounded-lg transition-colors" title="Video call">
                    <Video size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-foreground hover:bg-surface-700 rounded-lg transition-colors" title="Phone call">
                    <Phone size={16} />
                  </button>
                  <div className="w-px h-5 bg-white/5 mx-1" />
                  <button onClick={openScheduler} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-brand-500/20">
                    <Calendar size={13} /> Schedule
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 msg-scrollbar">
                <div className="flex justify-center mb-2">
                  <span className="px-3 py-1 rounded-full bg-surface-800/80 text-[10px] text-gray-500 font-medium">Today</span>
                </div>

                {activeConv.messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.isMeeting ? (
                      /* Meeting Card */
                      <div className="max-w-sm w-full">
                        <div className="glass-card p-4 border border-brand-500/20 bg-brand-500/5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                              <Calendar size={14} className="text-brand-400" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-foreground">Meeting Scheduled</div>
                              <div className="text-[10px] text-gray-500">{msg.time}</div>
                            </div>
                          </div>
                          <div className="text-foreground text-sm font-medium mb-2">{msg.meetingData.title}</div>
                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock size={12} /> <span>{msg.meetingData.date} at {msg.meetingData.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Video size={12} /> <span>{msg.meetingData.duration} min | {msg.meetingData.type}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-lg transition-colors">
                              Join Meeting
                            </button>
                            {!msg.meetingData.completed ? (
                              <button onClick={(e) => { e.stopPropagation(); markMeetingComplete(activeChat, msg.id) }}
                                className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg transition-colors border border-emerald-500/20">
                                Mark Complete
                              </button>
                            ) : (
                              <div className="flex-1 py-2 text-center text-emerald-400 text-xs font-medium bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                Completed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Message Bubble */
                      <div className="flex items-end gap-2 max-w-[65%]">
                        {!msg.sent && (
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[activeConv.id]} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                            {activeConv.avatar}
                          </div>
                        )}
                        <div>
                          <div className={`px-4 py-2.5 text-[13px] leading-relaxed ${
                            msg.sent
                              ? 'bg-brand-500 text-white rounded-2xl rounded-br-md'
                              : 'bg-surface-800 border border-white/5 text-foreground rounded-2xl rounded-bl-md'
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-500 ${msg.sent ? 'justify-end' : ''}`}>
                            <span>{msg.time}</span>
                            {msg.sent && (
                              msg.read ? <CheckCheck size={11} className="text-blue-400" /> : <Check size={11} />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {typing && (
                  <div className="flex items-end gap-2">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[activeChat]} flex items-center justify-center text-white text-[9px] font-bold`}>
                      {activeConv.avatar}
                    </div>
                    <div className="bg-surface-800 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Bar */}
              <div className="px-6 py-3 border-t border-white/5">
                <AnimatePresence>
                  {showEmoji && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex gap-1 mb-2 p-2 bg-surface-800 border border-white/5 rounded-xl"
                    >
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => setInput(prev => prev + e)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-surface-700 rounded-lg transition-colors">{e}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-foreground hover:bg-surface-800 rounded-lg transition-colors">
                    <Paperclip size={16} />
                  </button>
                  <button onClick={() => setShowEmoji(!showEmoji)} className={`p-2 rounded-lg transition-colors ${showEmoji ? 'text-brand-400 bg-brand-500/10' : 'text-gray-500 hover:text-foreground hover:bg-surface-800'}`}>
                    <Smile size={16} />
                  </button>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={`Message ${activeConv.name}...`}
                    className="flex-1 bg-surface-800/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500/40 focus:bg-surface-800 transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:hover:bg-brand-500 text-white rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/20"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT SIDEBAR - Candidate Info */}
        {activeConv && candidateInfo && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-[280px] border-l border-white/5 bg-surface-800/30 overflow-y-auto msg-scrollbar"
          >
            {/* Profile Card */}
            <div className="p-5 text-center border-b border-white/5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[activeConv.id]} flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-lg shadow-black/20`}>
                {activeConv.avatar}
              </div>
              <h3 className="text-foreground font-semibold text-sm">{activeConv.name}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{activeConv.role}</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <div className={`w-2 h-2 rounded-full ${activeConv.online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                <span className="text-xs text-gray-500">{activeConv.online ? 'Online' : `Last seen ${activeConv.lastActive}`}</span>
              </div>

              {/* Match Score */}
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400">{candidateInfo.matchScore}%</span>
                <span className="text-[10px] text-emerald-400/70">Match</span>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-4">
              {/* Applied For */}
              <div>
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Applied For</h4>
                <div className="p-2.5 rounded-lg bg-surface-700/30 border border-white/5">
                  <div className="text-xs text-foreground font-medium">{candidateInfo.appliedFor}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{candidateInfo.experience} experience</div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Mail size={12} className="text-gray-500 shrink-0" />
                    <span className="truncate">{candidateInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Phone size={12} className="text-gray-500 shrink-0" />
                    <span>{candidateInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin size={12} className="text-gray-500 shrink-0" />
                    <span>{candidateInfo.location}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {candidateInfo.skills.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-brand-500/8 border border-brand-500/15 text-[10px] text-brand-400 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scheduled Meetings */}
              {scheduledMeetings.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Meetings</h4>
                  <div className="space-y-2">
                    {scheduledMeetings.map(m => (
                      <div key={m.id} className="p-2.5 rounded-lg bg-surface-700/30 border border-white/5">
                        <div className="text-xs text-foreground font-medium truncate">{m.meetingData.title}</div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                          <Clock size={10} />
                          <span>{m.meetingData.date} | {m.meetingData.time}</span>
                        </div>
                        {m.meetingData.completed && (
                          <span className="inline-block mt-1 text-[10px] text-emerald-400 font-medium">Completed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</h4>
                <div className="space-y-1.5">
                  <button onClick={openScheduler} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-700/30 hover:bg-surface-700/60 border border-white/5 text-xs text-foreground transition-colors">
                    <Calendar size={13} className="text-brand-400" /> Schedule Interview
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-700/30 hover:bg-surface-700/60 border border-white/5 text-xs text-foreground transition-colors">
                    <User size={13} className="text-brand-400" /> View Full Profile
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* SCHEDULER MODAL */}
      <AnimatePresence>
        {showScheduler && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowScheduler(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-800 border border-white/5 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div>
                  <h3 className="text-foreground font-semibold">Schedule Meeting</h3>
                  <p className="text-xs text-gray-500 mt-0.5">with {activeConv?.name}</p>
                </div>
                <button onClick={() => setShowScheduler(false)} className="p-1.5 text-gray-400 hover:text-foreground hover:bg-surface-700 rounded-lg transition-colors"><X size={16} /></button>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-center gap-1 px-6 py-4">
                {['Type', 'Time', 'Details', 'Confirm'].map((s, i) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      i < schedStep ? 'bg-brand-500 text-white' :
                      i === schedStep ? 'bg-brand-500 text-white ring-2 ring-brand-500/30 ring-offset-2 ring-offset-surface-800' :
                      'bg-surface-700 text-gray-500'
                    }`}>
                      {i < schedStep ? <Check size={12} /> : i + 1}
                    </div>
                    <span className={`text-[10px] hidden sm:block ${i === schedStep ? 'text-foreground font-medium' : 'text-gray-500'}`}>{s}</span>
                    {i < 3 && <ChevronRight size={12} className="text-gray-700 mx-0.5" />}
                  </div>
                ))}
              </div>

              <div className="px-6 pb-6 slide-step" key={schedStep}>
                {/* Step 1: Meeting Type */}
                {schedStep === 0 && (
                  <div className="space-y-2.5">
                    <p className="text-gray-400 text-xs mb-3">Choose meeting format</p>
                    {[
                      { key: 'video', icon: Video, title: 'Video Interview', desc: 'Meet link auto-generated' },
                      { key: 'phone', icon: Phone, title: 'Phone Call', desc: 'Share number or use platform' },
                      { key: 'inperson', icon: MapPin, title: 'In-Person', desc: 'Add location or address' },
                    ].map(t => (
                      <div key={t.key} onClick={() => setMeetType(t.key)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          meetType === t.key
                            ? 'border-brand-500/40 bg-brand-500/8 shadow-lg shadow-brand-500/5'
                            : 'border-white/5 hover:border-white/10 bg-surface-700/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${meetType === t.key ? 'bg-brand-500/15 text-brand-400' : 'bg-surface-700 text-gray-400'}`}>
                            <t.icon size={16} />
                          </div>
                          <div>
                            <div className="text-foreground text-sm font-medium">{t.title}</div>
                            <div className="text-gray-500 text-[11px]">{t.desc}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => meetType && setSchedStep(1)} disabled={!meetType}
                      className="w-full mt-3 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-30 text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/20">
                      Continue
                    </button>
                  </div>
                )}

                {/* Step 2: Date & Time */}
                {schedStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Date</label>
                      <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-surface-700/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-500/40 transition-colors" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Time</label>
                      <input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)}
                        className="w-full bg-surface-700/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-500/40 transition-colors" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Duration</label>
                      <div className="flex gap-2">
                        {[30, 45, 60].map(d => (
                          <button key={d} onClick={() => setMeetDuration(d)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              meetDuration === d ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-surface-700/50 text-gray-400 hover:bg-surface-700'
                            }`}>
                            {d} min
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setSchedStep(0)} className="flex-1 py-2.5 bg-surface-700/50 hover:bg-surface-700 text-foreground text-sm font-medium rounded-xl transition-colors">Back</button>
                      <button onClick={() => meetDate && meetTime && setSchedStep(2)} disabled={!meetDate || !meetTime}
                        className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-30 text-white text-sm font-medium rounded-xl transition-all">Continue</button>
                    </div>
                  </div>
                )}

                {/* Step 3: Details */}
                {schedStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Title</label>
                      <input value={meetTitle} onChange={e => setMeetTitle(e.target.value)}
                        className="w-full bg-surface-700/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500/40 transition-colors" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Agenda</label>
                      <textarea value={meetAgenda} onChange={e => setMeetAgenda(e.target.value)} rows={2}
                        placeholder="Brief meeting agenda..."
                        className="w-full bg-surface-700/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500/40 resize-none transition-colors" />
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Calendar invite</span>
                        <button onClick={() => setCalInvite(!calInvite)}
                          className={`w-9 h-5 rounded-full transition-colors ${calInvite ? 'bg-brand-500' : 'bg-surface-600'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform mx-0.5 ${calInvite ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">30 min reminder</span>
                        <button onClick={() => setReminder(!reminder)}
                          className={`w-9 h-5 rounded-full transition-colors ${reminder ? 'bg-brand-500' : 'bg-surface-600'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform mx-0.5 ${reminder ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Meeting Link</label>
                      <div className="flex items-center gap-2 bg-surface-700/50 border border-white/5 rounded-xl px-3 py-2">
                        <span className="text-xs text-gray-400 flex-1 truncate">{meetLink}</span>
                        <button onClick={() => {
                          navigator.clipboard.writeText(meetLink)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 1500)
                        }}
                          className="text-gray-500 hover:text-foreground transition-colors shrink-0">
                          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
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
                      className="w-full py-2 bg-emerald-500/8 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 transition-colors font-medium">
                      Download Calendar (.ics)
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => setSchedStep(1)} className="flex-1 py-2.5 bg-surface-700/50 hover:bg-surface-700 text-foreground text-sm font-medium rounded-xl transition-colors">Back</button>
                      <button onClick={() => setSchedStep(3)} className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-all">Continue</button>
                    </div>
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {schedStep === 3 && (
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="inline-flex w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 items-center justify-center mx-auto"
                    >
                      <Check size={28} className="text-emerald-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-foreground font-semibold">Ready to Schedule</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Review and confirm the meeting</p>
                    </div>
                    <div className="bg-surface-700/30 border border-white/5 rounded-xl p-4 text-left space-y-2.5">
                      <div className="text-sm text-foreground font-medium">{meetTitle}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} /> {meetDate} at {meetTime}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Video size={12} /> {meetDuration} min | {meetType === 'video' ? 'Video Call' : meetType === 'phone' ? 'Phone Call' : 'In-Person'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSchedStep(2)} className="flex-1 py-2.5 bg-surface-700/50 hover:bg-surface-700 text-foreground text-sm font-medium rounded-xl transition-colors">Back</button>
                      <button onClick={sendMeetToChat} className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/20">
                        Confirm & Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

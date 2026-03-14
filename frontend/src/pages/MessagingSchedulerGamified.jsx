import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Smile, Search, MessageSquare, Check, CheckCheck, User, Mail, Briefcase, MapPin, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/auth'

const EMOJIS = ['😊', '👍', '🎉', '🔥', '💯', '🤝', '✨', '👏', '😄', '🙌', '💪', '🎯']

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-blue-500 to-cyan-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
]

function getAvatarColor(id) {
  const hash = (id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString()
}

export default function MessagingSchedulerGamified() {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)

  // New conversation
  const [showNewChat, setShowNewChat] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  const chatEndRef = useRef(null)
  const pollRef = useRef(null)

  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [])

  // Poll for new messages every 5s
  useEffect(() => {
    if (!user?.id) return
    pollRef.current = setInterval(() => {
      loadConversations()
      if (activeChat) loadMessages(activeChat, true)
    }, 5000)
    return () => clearInterval(pollRef.current)
  }, [activeChat, user?.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    try {
      const { data } = await api.get('/messages/conversations')
      setConversations(data || [])
    } catch {
      // silently fail for polling
    } finally {
      setLoadingConvs(false)
    }
  }

  async function loadMessages(userId, silent = false) {
    if (!silent) setLoadingMsgs(true)
    try {
      const { data } = await api.get(`/messages/${userId}`)
      setMessages(data || [])
    } catch (err) {
      if (!silent) toast.error('Failed to load messages')
    } finally {
      setLoadingMsgs(false)
    }
  }

  function selectChat(conv) {
    setActiveChat(conv.user_id)
    loadMessages(conv.user_id)
    setShowEmoji(false)
  }

  async function sendMessage() {
    if (!input.trim() || !activeChat || sending) return
    setSending(true)
    try {
      const { data } = await api.post('/messages/send', {
        receiver_id: activeChat,
        content: input.trim(),
      })
      setMessages(prev => [...prev, data])
      setInput('')
      setShowEmoji(false)
      loadConversations()
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function searchUsers(q) {
    setUserSearch(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearchingUsers(true)
    try {
      const { data } = await api.get('/messages/users/search', { params: { q } })
      setSearchResults(data || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearchingUsers(false)
    }
  }

  function startChatWith(userProfile) {
    setActiveChat(userProfile.id)
    loadMessages(userProfile.id)
    // Add to conversations if not already there
    setConversations(prev => {
      if (prev.find(c => c.user_id === userProfile.id)) return prev
      return [{
        user_id: userProfile.id,
        full_name: userProfile.full_name,
        email: userProfile.email,
        role: userProfile.role,
        avatar_url: userProfile.avatar_url,
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread: 0,
      }, ...prev]
    })
    setShowNewChat(false)
    setUserSearch('')
    setSearchResults([])
  }

  const activeConv = conversations.find(c => c.user_id === activeChat)
  const filteredConversations = conversations.filter(c =>
    (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0)

  return (
    <div className="min-h-screen bg-surface-900">
      <style dangerouslySetInnerHTML={{ __html: `
        .msg-scrollbar::-webkit-scrollbar { width: 4px; }
        .msg-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .msg-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}} />

      <div className="flex h-[calc(100vh-56px)]">

        {/* LEFT SIDEBAR - Conversations */}
        <div className="w-[320px] border-r border-white/5 flex flex-col bg-surface-800/50">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-display font-bold text-foreground">Messages</h1>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold">{totalUnread}</span>
                )}
              </div>
              <button onClick={() => setShowNewChat(true)}
                className="p-2 text-gray-400 hover:text-foreground hover:bg-surface-700 rounded-lg transition-colors" title="New conversation">
                <Plus size={16} />
              </button>
            </div>
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

          <div className="flex-1 overflow-y-auto msg-scrollbar px-2">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <button onClick={() => setShowNewChat(true)} className="text-brand-400 text-xs mt-2 hover:underline">Start a new chat</button>
              </div>
            ) : (
              filteredConversations.map((c, i) => (
                <motion.div
                  key={c.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => selectChat(c)}
                  className={`flex items-center gap-3 px-3 py-3 mx-1 mb-0.5 cursor-pointer rounded-xl transition-all duration-200 ${
                    activeChat === c.user_id
                      ? 'bg-brand-500/8 border border-brand-500/20'
                      : 'hover:bg-surface-700/40 border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(c.user_id)} flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-black/20`}>
                        {getInitials(c.full_name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-foreground text-sm font-semibold truncate">{c.full_name || c.email}</span>
                      <span className="text-[10px] text-gray-500 shrink-0 ml-2">{timeAgo(c.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400 truncate pr-2">
                        {c.last_message?.substring(0, 40) || 'No messages yet'}
                      </div>
                      {(c.unread || 0) > 0 && (
                        <span className="shrink-0 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">{c.unread}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* CENTER - Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConv && !activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-surface-800 border border-white/5 flex items-center justify-center mb-5">
                <MessageSquare size={32} className="text-gray-600" />
              </div>
              <h2 className="text-foreground font-display font-semibold text-lg mb-1">Your Messages</h2>
              <p className="text-gray-500 text-sm">Select a conversation or start a new one</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-surface-800/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {activeConv?.avatar_url ? (
                    <img src={activeConv.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(activeChat)} flex items-center justify-center text-white text-xs font-bold`}>
                      {getInitials(activeConv?.full_name)}
                    </div>
                  )}
                  <div>
                    <div className="text-foreground text-sm font-semibold">{activeConv?.full_name || 'User'}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="capitalize">{activeConv?.role || ''}</span>
                      {activeConv?.email && (
                        <>
                          <span className="text-gray-600">|</span>
                          <span>{activeConv.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 msg-scrollbar">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    <p>No messages yet. Say hi!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id
                    const msgDate = new Date(msg.created_at)
                    const timeStr = !isNaN(msgDate.getTime())
                      ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-end gap-2 max-w-[65%]">
                          {!isMine && (
                            activeConv?.avatar_url ? (
                              <img src={activeConv.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(activeChat)} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                                {getInitials(activeConv?.full_name)}
                              </div>
                            )
                          )}
                          <div>
                            <div className={`px-4 py-2.5 text-[13px] leading-relaxed ${
                              isMine
                                ? 'bg-brand-500 text-white rounded-2xl rounded-br-md'
                                : 'bg-surface-800 border border-white/5 text-foreground rounded-2xl rounded-bl-md'
                            }`}>
                              {msg.content}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-500 ${isMine ? 'justify-end' : ''}`}>
                              <span>{timeStr}</span>
                              {isMine && (
                                msg.read ? <CheckCheck size={11} className="text-blue-400" /> : <Check size={11} />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
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
                  <button onClick={() => setShowEmoji(!showEmoji)} className={`p-2 rounded-lg transition-colors ${showEmoji ? 'text-brand-400 bg-brand-500/10' : 'text-gray-500 hover:text-foreground hover:bg-surface-800'}`}>
                    <Smile size={16} />
                  </button>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={`Message ${activeConv?.full_name || 'user'}...`}
                    className="flex-1 bg-surface-800/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500/40 focus:bg-surface-800 transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:hover:bg-brand-500 text-white rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/20"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT SIDEBAR - Contact Info */}
        {activeConv && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-[280px] border-l border-white/5 bg-surface-800/30 overflow-y-auto msg-scrollbar"
          >
            <div className="p-5 text-center border-b border-white/5">
              {activeConv.avatar_url ? (
                <img src={activeConv.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 shadow-lg shadow-black/20" />
              ) : (
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarColor(activeChat)} flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-lg shadow-black/20`}>
                  {getInitials(activeConv.full_name)}
                </div>
              )}
              <h3 className="text-foreground font-semibold text-sm">{activeConv.full_name}</h3>
              <p className="text-gray-400 text-xs mt-0.5 capitalize">{activeConv.role}</p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact</h4>
                <div className="space-y-2">
                  {activeConv.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Mail size={12} className="text-gray-500 shrink-0" />
                      <span className="truncate">{activeConv.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Briefcase size={12} className="text-gray-500 shrink-0" />
                    <span className="capitalize">{activeConv.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* NEW CHAT MODAL */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewChat(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-800 border border-white/5 rounded-2xl shadow-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-foreground font-semibold">New Conversation</h3>
                <p className="text-xs text-gray-500 mt-0.5">Search for a recruiter or candidate to message</p>
              </div>
              <div className="p-6">
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={userSearch}
                    onChange={e => searchUsers(e.target.value)}
                    placeholder="Search by name or email..."
                    autoFocus
                    className="w-full bg-surface-700/50 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchingUsers ? (
                    <div className="text-center py-4">
                      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => startChatWith(u)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-700/50 transition-colors text-left"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(u.id)} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(u.full_name)}
                          </div>
                        )}
                        <div>
                          <div className="text-foreground text-sm font-medium">{u.full_name || u.email}</div>
                          <div className="text-xs text-gray-500 capitalize">{u.role}</div>
                        </div>
                      </button>
                    ))
                  ) : userSearch.length >= 2 ? (
                    <p className="text-center text-gray-500 text-sm py-4">No users found</p>
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-4">Type at least 2 characters to search</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

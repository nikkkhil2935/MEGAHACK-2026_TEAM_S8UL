import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, Plus, Trash2, Loader2, Bot, User, Sparkles, Paperclip, X, Menu } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const MODES = [
  { id: 'general', label: 'Career Coach', emoji: '💼' },
  { id: 'resume', label: 'Resume Review', emoji: '📝' },
  { id: 'interview', label: 'Interview Prep', emoji: '🎤' },
  { id: 'salary', label: 'Salary Negotiation', emoji: '💰' },
  { id: 'career', label: 'Career Advice', emoji: '🗺️' },
  { id: 'dsa', label: 'DSA Tutor', emoji: '🧠' },
  { id: 'system', label: 'System Design', emoji: '⚙️' },
]

export default function Tutor() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState('general')
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [suggestedQs, setSuggestedQs] = useState([])
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => { fetchSessions() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function fetchSessions() {
    try {
      const { data } = await api.get('/tutor/sessions')
      setSessions(data)
    } catch { /* silent */ }
    finally { setLoadingSessions(false) }
  }

  async function createSession() {
    try {
      const { data } = await api.post('/tutor/sessions', { name: `${MODES.find(m => m.id === mode)?.label || 'Chat'} Session`, mode })
      setSessions(prev => [data, ...prev])
      setActiveSession(data)
      setMessages([])
      setUploadedDocs([])
    } catch { toast.error('Failed to create session') }
  }

  async function deleteSession(id) {
    try {
      await api.delete(`/tutor/sessions/${id}`)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (activeSession?.id === id) { setActiveSession(null); setMessages([]); setUploadedDocs([]) }
    } catch { toast.error('Failed to delete session') }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setSending(true)

    try {
      const { data } = await api.post('/tutor/chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        mode,
        session_id: activeSession?.id,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch { toast.error('Failed to get response') }
    finally { setSending(false) }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !activeSession) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('session_id', activeSession.id)
      const { data } = await api.post('/tutor/upload-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadedDocs(prev => [...prev, { name: data.name, chars: data.chars }])
      setMessages(prev => [...prev, { role: 'assistant', content: `📄 Document uploaded: ${data.name} (${data.chars} chars)\nPreview: ${data.preview}...` }])
      toast.success(`Uploaded ${data.name}`)
      // Generate suggested questions
      try {
        const { data: suggestions } = await api.post('/tutor/suggest', { chat_id: activeSession.id })
        if (suggestions?.questions) setSuggestedQs(suggestions.questions)
      } catch {}
    } catch { toast.error('Failed to upload document') }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 h-[calc(100vh-6rem)]">
      {/* Mobile sidebar toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden flex items-center gap-2 text-sm text-gray-400 hover:text-foreground transition-colors cursor-pointer">
        <Menu size={18} /> {sidebarOpen ? 'Hide Sessions' : 'Show Sessions'}
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 shrink-0 flex-col`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Sessions</h2>
          <button onClick={createSession}
            className="p-1.5 bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors cursor-pointer">
            <Plus size={14} className="text-white" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mb-4">
          <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Mode</label>
          <select value={mode} onChange={e => setMode(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-700 border border-white/10 rounded-lg text-xs text-foreground focus:outline-none focus:border-brand-500">
            {MODES.map(m => (
              <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {loadingSessions ? (
            <Loader2 className="animate-spin text-gray-500 mx-auto mt-4" size={20} />
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-500 text-center mt-4">No sessions yet</p>
          ) : sessions.map(s => (
            <div key={s.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${activeSession?.id === s.id ? 'bg-brand-500/10 text-brand-400' : 'text-gray-400 hover:bg-surface-700'}`}
              onClick={() => { setActiveSession(s); setMode(s.mode || 'general'); setMessages(s.messages || []) }}>
              <span className="truncate">{s.session_name}</span>
              <button onClick={e => { e.stopPropagation(); deleteSession(s.id) }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity cursor-pointer">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-800 border border-white/5 rounded-xl overflow-hidden">
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Sparkles size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">AI Career Tutor</p>
            <p className="text-sm mt-1">Create a session to start chatting</p>
            <div className="flex flex-wrap gap-2 mt-6 max-w-md justify-center">
              {MODES.map(m => (
                <button key={m.id} onClick={() => { setMode(m.id); createSession() }}
                  className="px-3 py-1.5 bg-surface-700 hover:bg-surface-600 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer">
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                  <Bot size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Start a conversation with your AI tutor</p>
                  <p className="text-xs mt-1 text-gray-600">Mode: {MODES.find(m => m.id === mode)?.label}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-brand-400" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-brand-500 text-white' : 'bg-surface-700 text-gray-200'}`}>
                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-surface-600 flex items-center justify-center shrink-0">
                      <User size={14} className="text-gray-400" />
                    </div>
                  )}
                </motion.div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center">
                    <Bot size={14} className="text-brand-400" />
                  </div>
                  <div className="bg-surface-700 rounded-xl px-4 py-3">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {suggestedQs.length > 0 && messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                <span className="text-xs text-gray-500 w-full mb-1">Suggested questions:</span>
                {suggestedQs.map((q, i) => (
                  <button key={i} onClick={() => { setInput(q); setSuggestedQs([]) }}
                    className="text-xs px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-foreground rounded-full border border-white/5 transition-colors truncate max-w-xs">
                    {q}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={sendMessage} className="border-t border-white/5 p-4">
              {uploadedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {uploadedDocs.map((doc, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-brand-500/10 text-brand-400 rounded-md text-xs">
                      📄 {doc.name}
                      <button type="button" onClick={() => setUploadedDocs(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-400 cursor-pointer">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.txt,.md,.csv,.json" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || !activeSession}
                  className="px-3 py-2.5 bg-surface-700 hover:bg-surface-600 disabled:opacity-50 text-gray-400 rounded-lg transition-colors cursor-pointer" title="Upload document">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                </button>
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder={`Ask your ${MODES.find(m => m.id === mode)?.label?.toLowerCase()} anything...`}
                  className="flex-1 px-4 py-2.5 bg-surface-700 border border-white/10 rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-brand-500"
                  disabled={sending} />
                <button type="submit" disabled={sending || !input.trim()}
                  className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

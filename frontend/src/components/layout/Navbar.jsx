import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useThemeStore } from '../../store/theme'
import { getSocket } from '../../services/socket'
import api from '../../services/api'
import Logo from '../common/Logo'
import {
  LayoutDashboard,
  Briefcase,
  Mic,
  User,
  LogOut,
  History,
  Map,
  Building2,
  PlusCircle,
  BarChart3,
  Menu,
  X,
  Sun,
  Moon,
  MessageSquare,
  Phone,
  DollarSign,
  FileText,
  Github,
  Bot,
  Brain,
  Bell,
  CheckCheck,
  UserPlus
} from 'lucide-react'

function NotificationPanel({ notifications, onNotifClick, onMarkAllRead, timeAgo }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 max-h-96 bg-surface-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-foreground text-sm font-bold">Notifications</h3>
        <button onClick={onMarkAllRead} className="text-[11px] text-brand-400 hover:underline font-medium flex items-center gap-1">
          <CheckCheck size={12} /> Mark all read
        </button>
      </div>
      <div className="overflow-y-auto max-h-72">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Bell size={24} className="mx-auto mb-2 opacity-40" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((n, i) => (
            <button
              key={n.id || i}
              onClick={() => onNotifClick(n)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-surface-700/50 border-b border-white/5 last:border-0 ${
                !n.read ? 'bg-brand-500/5' : ''
              }`}
            >
              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                n.type === 'new_application' ? 'bg-green-500/15 text-green-400' : 'bg-brand-500/15 text-brand-400'
              }`}>
                {n.type === 'new_application' ? <UserPlus size={14} /> : <Bell size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-semibold truncate ${!n.read ? 'text-foreground' : 'text-gray-400'}`}>{n.title}</p>
                  <span className="text-[10px] text-gray-500 shrink-0">{timeAgo(n.created_at)}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                {n.data?.match_score != null && (
                  <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    n.data.match_score >= 75 ? 'bg-green-500/15 text-green-400' :
                    n.data.match_score >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {n.data.match_score}% match
                  </span>
                )}
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const notifRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isRecruiter = user?.role === 'recruiter'

  // Fetch notifications on mount
  useEffect(() => {
    if (!user?.id) return
    fetchNotifications()
    fetchUnreadCount()
  }, [user?.id])

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!user?.id) return
    const socket = getSocket()
    if (!socket) return

    const handleNewNotif = (notif) => {
      setNotifications(prev => [{
        ...notif,
        id: notif.id || `rt_${Date.now()}`,
        read: false,
        created_at: notif.time || new Date().toISOString()
      }, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    socket.on('new_notification', handleNewNotif)
    return () => socket.off('new_notification', handleNewNotif)
  }, [user?.id])

  // Close notif panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotifications() {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data || [])
    } catch {}
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.count || 0)
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  function handleNotifClick(notif) {
    if (!notif.read) {
      api.patch(`/notifications/${notif.id}/read`).catch(() => {})
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    if (notif.type === 'new_application' && notif.data?.job_id) {
      navigate(`/recruiter/job/${notif.data.job_id}`)
      setShowNotifPanel(false)
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return d.toLocaleDateString()
  }

  const candidateLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/jobs', icon: Briefcase, label: 'Workspace' },
    { to: '/interview', icon: Mic, label: 'Interviews' },
    { to: '/interview/history', icon: History, label: 'History & Analytics' },
    { to: '/tutor', icon: Bot, label: 'AI Tutor' },
    { to: '/quiz', icon: Brain, label: 'Quizzes' },
    { to: '/resume-improver', icon: FileText, label: 'Resume AI' },
    { to: '/github', icon: Github, label: 'GitHub AI' },
    { to: '/roadmap', icon: Map, label: 'Roadmap' },
    { to: '/salary', icon: DollarSign, label: 'Salary' },
    { to: '/messaging', icon: MessageSquare, label: 'Messages' },
  ]

  const recruiterLinks = [
    { to: '/recruiter', icon: Building2, label: 'Dashboard' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/recruiter/post-job', icon: PlusCircle, label: 'Post Job' },
    { to: '/recruiter/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/ai-calling', icon: Phone, label: 'AI Calls' },
    { to: '/messaging', icon: MessageSquare, label: 'Messages' },
    { to: '/jobs', icon: Briefcase, label: 'Browse Jobs' },
  ]

  const links = isRecruiter ? recruiterLinks : candidateLinks

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-900 border-b border-black/5 dark:border-white/5 h-16 w-full shrink-0 z-50">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-display font-semibold text-foreground">CareerBridge</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Mobile notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifPanel(o => !o)}
              className="relative p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-700 transition-colors cursor-pointer"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <button onClick={() => setMobileOpen(o => !o)}
            className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-700 transition-colors cursor-pointer">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface-900 border-r border-black/5 dark:border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col h-full ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3 mb-8">
            <Logo size="sm" />
            <span className="font-display font-semibold text-foreground text-xl">CareerBridge</span>
          </Link>

          {/* User Profile Info */}
          <Link to="/profile" className="flex flex-col items-center justify-center mb-8 group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-surface-700 border-2 border-surface-600 mb-3 overflow-hidden group-hover:border-brand-500/50 transition-colors">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <h2 className="text-foreground font-display font-bold text-lg">{user?.full_name || 'User'}</h2>
            <p className="text-gray-500 text-xs mt-1 capitalize">{user?.role || 'Candidate'}</p>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 overflow-y-auto space-y-1">
          {links.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || (location.pathname.startsWith(to + '/') && to !== '/' && to !== '/interview' && to !== '/recruiter')
            return (
              <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                    : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-800'
                }`}>
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-6 mt-auto">
          <div className="flex items-center justify-between">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifPanel(o => !o)}
                className="relative p-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-foreground-muted hover:text-foreground hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors cursor-pointer shadow-sm border border-gray-100 dark:border-white/5"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifPanel && (
                <NotificationPanel
                  notifications={notifications}
                  onNotifClick={handleNotifClick}
                  onMarkAllRead={markAllRead}
                  timeAgo={timeAgo}
                />
              )}
            </div>
            <button onClick={toggleTheme}
              className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-foreground-muted hover:text-foreground hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors cursor-pointer shadow-sm border border-gray-100 dark:border-white/5"
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={handleLogout}
              className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer shadow-sm border border-red-100 dark:border-red-500/10"
              aria-label="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}

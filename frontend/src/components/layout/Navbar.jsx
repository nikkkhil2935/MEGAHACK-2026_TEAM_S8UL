import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useThemeStore } from '../../store/theme'
import Logo from '../common/Logo'
import {
  LayoutDashboard,
  Briefcase,
  Mic,
  User,
  LogOut,
  History,
  Map,
  MessageCircle,
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
  Brain
} from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isRecruiter = user?.role === 'recruiter'

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
        <button onClick={() => setMobileOpen(o => !o)}
          className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-700 transition-colors cursor-pointer">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface-900 border-r border-black/5 dark:border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col h-full ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3 mb-8">
            <Logo size="sm" />
            <span className="font-display font-semibold text-foreground text-xl">CareerBridge</span>
          </Link>

          {/* User Profile Info (like reference) */}
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

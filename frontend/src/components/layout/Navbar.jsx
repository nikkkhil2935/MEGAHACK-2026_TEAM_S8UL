import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useThemeStore } from '../../store/theme'
import { LayoutDashboard, Briefcase, Mic, User, LogOut, History, Map, MessageCircle, Building2, PlusCircle, BarChart3, Menu, X, Sun, Moon, MessageSquare, Phone } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isRecruiter = user?.role === 'recruiter'

  const candidateLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/interview', icon: Mic, label: 'Interview' },
    { to: '/interview/history', icon: History, label: 'History' },
    { to: '/roadmap', icon: Map, label: 'Roadmap' },
    { to: '/tutor', icon: MessageCircle, label: 'Tutor' },
    { to: '/messaging', icon: MessageSquare, label: 'Messages' },
    { to: '/profile', icon: User, label: 'Profile' },
  ]

  const recruiterLinks = [
    { to: '/recruiter', icon: Building2, label: 'Dashboard' },
    { to: '/recruiter/post-job', icon: PlusCircle, label: 'Post Job' },
    { to: '/recruiter/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/ai-calling', icon: Phone, label: 'AI Calls' },
    { to: '/messaging', icon: MessageSquare, label: 'Messages' },
    { to: '/jobs', icon: Briefcase, label: 'Browse Jobs' },
    { to: '/profile', icon: User, label: 'Profile' },
  ]

  const links = isRecruiter ? recruiterLinks : candidateLinks

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 dark:border-white/5 bg-surface-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs font-bold">CB</div>
          <span className="font-display font-semibold text-foreground text-sm hidden sm:block">CareerBridge AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-surface-700 transition-colors">
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          ))}

          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-2" />

          <span className="text-xs text-foreground-muted mr-2">
            {user?.full_name || user?.email}
          </span>

          <button onClick={toggleTheme}
            className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-700 transition-colors cursor-pointer"
            aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
            <LogOut size={15} />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(o => !o)}
          className="md:hidden p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-700 transition-colors cursor-pointer">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-3 space-y-1 border-t border-black/5 dark:border-white/5 bg-surface-900/95 backdrop-blur-md">
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface-700 transition-colors">
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div className="h-px bg-black/5 dark:bg-white/5 my-2" />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-foreground-muted">{user?.full_name || user?.email}</span>
            <button onClick={toggleTheme}
              className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-700 transition-colors cursor-pointer"
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

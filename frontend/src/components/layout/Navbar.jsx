import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { LayoutDashboard, Briefcase, Mic, User, LogOut, History, Map, MessageCircle } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/interview', icon: Mic, label: 'Interview' },
    { to: '/interview/history', icon: History, label: 'History' },
    { to: '/roadmap', icon: Map, label: 'Roadmap' },
    { to: '/tutor', icon: MessageCircle, label: 'Tutor' },
    { to: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-surface-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs font-bold">CB</div>
          <span className="font-display font-semibold text-white text-sm hidden sm:block">CareerBridge AI</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-surface-700 transition-colors">
              <Icon size={15} />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}

          <div className="w-px h-6 bg-white/10 mx-2" />

          <span className="text-xs text-gray-500 hidden sm:block mr-2">
            {user?.full_name || user?.email}
          </span>

          <button onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  )
}

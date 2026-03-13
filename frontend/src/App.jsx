import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/auth'
import { useThemeStore } from './store/theme'
import Navbar from './components/layout/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Interview from './pages/Interview'
import InterviewReport from './pages/InterviewReport'
import InterviewHistory from './pages/InterviewHistory'
import Roadmap from './pages/Roadmap'
import RoadmapDetail from './pages/RoadmapDetail'
import Quiz from './pages/Quiz'
import Tutor from './pages/Tutor'
import RecruiterDashboard from './pages/RecruiterDashboard'
import PostJob from './pages/PostJob'
import ViewJobApplications from './pages/ViewJobApplications'
import RecruiterAnalytics from './pages/RecruiterAnalytics'
import MessagingSchedulerGamified from './pages/MessagingSchedulerGamified'
import AICallingSystem from './pages/AICallingSystem'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

function RootRedirect() {
  const { user } = useAuthStore()
  return <Navigate to={user?.role === 'recruiter' ? '/recruiter' : '/dashboard'} />
}

export default function App() {
  const { token } = useAuthStore()

  useEffect(() => {
    useThemeStore.getState().initTheme()
  }, [])

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: 'var(--color-surface-700)', color: 'inherit', border: '1px solid rgba(128,128,128,0.15)', borderRadius: '12px', fontSize: '13px' },
          duration: 3000,
        }}
      />
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={token ? <RootRedirect /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
        <Route path="/jobs/:id" element={<PrivateRoute><JobDetail /></PrivateRoute>} />
        <Route path="/interview" element={<PrivateRoute><Interview /></PrivateRoute>} />
        <Route path="/interview/report/:id" element={<PrivateRoute><InterviewReport /></PrivateRoute>} />
        <Route path="/interview/history" element={<PrivateRoute><InterviewHistory /></PrivateRoute>} />
        <Route path="/roadmap" element={<PrivateRoute><Roadmap /></PrivateRoute>} />
        <Route path="/roadmap/:id" element={<PrivateRoute><RoadmapDetail /></PrivateRoute>} />
        <Route path="/quiz" element={<PrivateRoute><Quiz /></PrivateRoute>} />
        <Route path="/tutor" element={<PrivateRoute><Tutor /></PrivateRoute>} />
        <Route path="/recruiter" element={<PrivateRoute><RecruiterDashboard /></PrivateRoute>} />
        <Route path="/recruiter/post-job" element={<PrivateRoute><PostJob /></PrivateRoute>} />
        <Route path="/recruiter/analytics" element={<PrivateRoute><RecruiterAnalytics /></PrivateRoute>} />
        <Route path="/recruiter/job/:id" element={<PrivateRoute><ViewJobApplications /></PrivateRoute>} />
        <Route path="/messaging" element={<PrivateRoute><MessagingSchedulerGamified /></PrivateRoute>} />
        <Route path="/ai-calling" element={<PrivateRoute><AICallingSystem /></PrivateRoute>} />
      </Routes>
    </>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/auth'
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

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  const { token } = useAuthStore()

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid rgba(255,255,255,0.1)' }
        }}
      />
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
        <Route path="/jobs/:id" element={<PrivateRoute><JobDetail /></PrivateRoute>} />
        <Route path="/interview" element={<PrivateRoute><Interview /></PrivateRoute>} />
        <Route path="/interview/report/:id" element={<PrivateRoute><InterviewReport /></PrivateRoute>} />
        <Route path="/interview/history" element={<PrivateRoute><InterviewHistory /></PrivateRoute>} />
      </Routes>
    </>
  )
}

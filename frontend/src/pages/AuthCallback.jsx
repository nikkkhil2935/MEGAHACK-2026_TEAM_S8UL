import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { getHomeRoute } from '../constants'
import toast from 'react-hot-toast'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { handleOAuthCallback } = useAuthStore()
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    handleOAuthCallback()
      .then(user => {
        if (!mounted) return
        toast.success('Welcome!')
        navigate(getHomeRoute(user?.role), { replace: true })
      })
      .catch(err => {
        if (!mounted) return
        setError(err.message || 'Authentication failed')
        toast.error('Google sign-in failed')
        setTimeout(() => navigate('/login'), 2000)
      })

    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-400 font-medium">{error}</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin text-brand-400 mx-auto mb-4" size={32} />
            <p className="text-foreground font-medium">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  )
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'
import { supabase } from '../services/supabase'

export const useAuthStore = create(persist(
  (set) => ({
    user: null,
    token: null,

    login: async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password })
      set({ user: data.user, token: data.token })
      return data.user
    },

    register: async (payload) => {
      const { data } = await api.post('/auth/register', payload)
      set({ user: data.user, token: data.token })
      return data.user
    },

    loginWithGoogle: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    },

    handleOAuthCallback: async () => {
      // Wait for Supabase to process the URL hash fragment (#access_token=...)
      const { data: { session }, error } = await new Promise((resolve) => {
        // First check if session already exists
        supabase.auth.getSession().then(result => {
          if (result.data.session) return resolve(result)
          // If no session yet, wait for Supabase to process the hash
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
              if (session) {
                subscription.unsubscribe()
                resolve({ data: { session }, error: null })
              }
            }
          )
          // Timeout after 10 seconds
          setTimeout(() => {
            subscription.unsubscribe()
            resolve({ data: { session: null }, error: new Error('OAuth timeout') })
          }, 10000)
        })
      })

      if (error || !session) throw new Error(error?.message || 'OAuth session not found')

      const { data } = await api.post('/auth/oauth-callback', {
        access_token: session.access_token,
        provider: 'google'
      })
      set({ user: data.user, token: data.token })
      return data.user
    },

    logout: () => {
      set({ user: null, token: null })
      supabase.auth.signOut().catch(() => {})
    },

    setUser: (user) => set({ user }),
    updateLanguage: (lang) => {
      set(s => ({ user: { ...s.user, preferred_language: lang } }))
      localStorage.setItem('lang', lang)
    }
  }),
  { name: 'careerbridge-auth' }
))

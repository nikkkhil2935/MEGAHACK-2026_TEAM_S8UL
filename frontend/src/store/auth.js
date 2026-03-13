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
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      return data.user
    },

    register: async (payload) => {
      const { data } = await api.post('/auth/register', payload)
      set({ user: data.user, token: data.token })
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
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
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) throw new Error('OAuth session not found')

      const { data } = await api.post('/auth/oauth-callback', {
        access_token: session.access_token,
        provider: 'google'
      })
      set({ user: data.user, token: data.token })
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      return data.user
    },

    logout: () => {
      set({ user: null, token: null })
      delete api.defaults.headers.common['Authorization']
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

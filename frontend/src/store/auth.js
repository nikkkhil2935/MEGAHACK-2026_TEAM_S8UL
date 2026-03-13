import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

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

    logout: () => {
      set({ user: null, token: null })
      delete api.defaults.headers.common['Authorization']
    },

    setUser: (user) => set({ user }),
    updateLanguage: (lang) => {
      set(s => ({ user: { ...s.user, preferred_language: lang } }))
      localStorage.setItem('lang', lang)
    }
  }),
  { name: 'careerbridge-auth' }
))

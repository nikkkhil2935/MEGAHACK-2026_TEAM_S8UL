import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(persist(
  (set, get) => ({
    theme: 'light', // default light
    toggleTheme: () => {
      const next = get().theme === 'light' ? 'dark' : 'light'
      set({ theme: next })
      applyTheme(next)
    },
    initTheme: () => applyTheme(get().theme)
  }),
  { name: 'careerbridge-theme' }
))

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

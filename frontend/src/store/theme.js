import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(persist(
  (set, get) => ({
    theme: 'light', // Force light
    toggleTheme: () => {
      // Disabled: UI fully in light mode, no dark mode
      set({ theme: 'light' })
      applyTheme('light')
    },
    initTheme: () => applyTheme('light')
  }),
  { name: 'careerbridge-theme' }
))

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', 'light')
  document.documentElement.classList.remove('dark')
}

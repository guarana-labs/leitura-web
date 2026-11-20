import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from '@/app/providers/theme-context'

const STORAGE_KEY = 'leitura-theme'

function readInitialTheme(): Theme {
  // index.html applies the saved theme before React loads; reuse that result.
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Storage may be unavailable (private mode); the theme still applies for this visit.
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

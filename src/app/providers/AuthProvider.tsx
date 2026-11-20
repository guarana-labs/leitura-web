import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, type AuthContextValue } from '@/app/providers/auth-context'
import { getSession, onAuthStateChange } from '@/services/authService'

/** Keeps the current Supabase session in React state. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    getSession()
      .then((current) => {
        if (isActive) setSession(current)
      })
      .catch(() => {
        // A broken stored session simply means "signed out".
        if (isActive) setSession(null)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    const unsubscribe = onAuthStateChange((_event, next) => {
      setSession(next)
      setIsLoading(false)
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, isLoading }),
    [session, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

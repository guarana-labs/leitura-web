import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  /** True until the stored session has been read on startup. */
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Credentials {
  email: string
  password: string
}

export interface SignUpResult {
  /** False when the Supabase project still requires email confirmation. */
  signedIn: boolean
}

export async function signIn({ email, password }: Credentials): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
}

export async function signUp({ email, password }: Credentials): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
  if (error) throw error
  return { signedIn: data.session !== null }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/** Subscribes to sign-in / sign-out / token refresh events. Returns an unsubscribe function. */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback)
  return () => data.subscription.unsubscribe()
}

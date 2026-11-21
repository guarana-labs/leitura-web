import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Credentials {
  email: string
  password: string
}

export interface SignUpResult {
  /** False when the Supabase project still requires email confirmation. */
  signedIn: boolean
  /**
   * True when the email already has an account. With email confirmation on, Supabase
   * doesn't return an error for this (to avoid revealing who is registered): it answers
   * with a placeholder user that has no identities and sends no email.
   */
  alreadyRegistered: boolean
}

export async function signIn({ email, password }: Credentials): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
}

export async function signUp({ email, password }: Credentials): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
  if (error) throw error
  return {
    signedIn: data.session !== null,
    alreadyRegistered: data.session === null && data.user?.identities?.length === 0,
  }
}

/**
 * Emails a password recovery link. The link opens `redirectTo` with a temporary
 * session, where the user picks a new password (see `updatePassword`).
 * `redirectTo` must be listed in Supabase → Authentication → URL Configuration.
 */
export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
  if (error) throw error
}

/** Sets a new password for the signed-in user (including the temporary recovery session). */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
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

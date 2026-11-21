import { isAuthError, isAuthRetryableFetchError, isAuthSessionMissingError } from '@supabase/supabase-js'

export type AuthErrorKey =
  | 'auth.errors.invalidCredentials'
  | 'auth.errors.emailInUse'
  | 'auth.errors.weakPassword'
  | 'auth.errors.invalidEmail'
  | 'auth.errors.rateLimited'
  | 'auth.errors.emailNotConfirmed'
  | 'auth.errors.signupDisabled'
  | 'auth.errors.samePassword'
  | 'auth.errors.recoveryLinkInvalid'
  | 'auth.errors.network'
  | 'auth.errors.generic'

const errorKeysByCode: Record<string, AuthErrorKey> = {
  invalid_credentials: 'auth.errors.invalidCredentials',
  user_already_exists: 'auth.errors.emailInUse',
  email_exists: 'auth.errors.emailInUse',
  weak_password: 'auth.errors.weakPassword',
  email_address_invalid: 'auth.errors.invalidEmail',
  validation_failed: 'auth.errors.invalidEmail',
  over_request_rate_limit: 'auth.errors.rateLimited',
  over_email_send_rate_limit: 'auth.errors.rateLimited',
  email_not_confirmed: 'auth.errors.emailNotConfirmed',
  signup_disabled: 'auth.errors.signupDisabled',
  email_provider_disabled: 'auth.errors.signupDisabled',
  same_password: 'auth.errors.samePassword',
  // The recovery session behind a reset link is gone or the link was already used/expired.
  otp_expired: 'auth.errors.recoveryLinkInvalid',
  session_not_found: 'auth.errors.recoveryLinkInvalid',
  session_expired: 'auth.errors.recoveryLinkInvalid',
}

/** Maps a Supabase auth error to a translation key with a user-friendly message. */
export function getAuthErrorKey(error: unknown): AuthErrorKey {
  if (isAuthRetryableFetchError(error)) return 'auth.errors.network'
  if (isAuthSessionMissingError(error)) return 'auth.errors.recoveryLinkInvalid'
  if (isAuthError(error) && error.code && error.code in errorKeysByCode) {
    return errorKeysByCode[error.code]
  }
  if (error instanceof TypeError) return 'auth.errors.network'
  return 'auth.errors.generic'
}

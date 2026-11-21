import { useState, type FormEvent } from 'react'
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, signUp } from '@/services/authService'
import { getAuthErrorKey } from '@/utils/authErrors'

export type AuthMode = 'signIn' | 'signUp'

/** Matches Supabase's default minimum password length. */
const MIN_PASSWORD_LENGTH = 6

type FormMessage = { kind: 'error' | 'success'; text: string }

interface AuthFormProps {
  mode: AuthMode
  /** Shows a "forgot password" link next to the password label when signing in. */
  onForgotPassword?: () => void
}

/**
 * Email + password form for both signing in and creating an account.
 * On success the AuthProvider receives the new session and the route guard
 * redirects to the library, so nothing else needs to happen here.
 */
export function AuthForm({ mode, onForgotPassword }: AuthFormProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<FormMessage | null>(null)

  const isSignUp = mode === 'signUp'
  const idPrefix = `auth-${mode}`

  function validate(): string | null {
    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      return t('auth.errors.passwordTooShort', { count: MIN_PASSWORD_LENGTH })
    }
    if (isSignUp && password !== confirmPassword) {
      return t('auth.errors.passwordMismatch')
    }
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const validationError = validate()
    if (validationError) {
      setMessage({ kind: 'error', text: validationError })
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    try {
      if (isSignUp) {
        const { signedIn, alreadyRegistered } = await signUp({ email, password })
        if (alreadyRegistered) {
          setMessage({ kind: 'error', text: t('auth.errors.emailInUse') })
        } else if (!signedIn) {
          setMessage({ kind: 'success', text: t('auth.confirmEmailSent', { email: email.trim() }) })
        }
      } else {
        await signIn({ email, password })
      }
    } catch (error) {
      setMessage({ kind: 'error', text: t(getAuthErrorKey(error)) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-email`}>{t('auth.email')}</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${idPrefix}-password`}>{t('auth.password')}</Label>
          {!isSignUp && onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t('auth.forgot.link')}
            </button>
          )}
        </div>
        <PasswordInput
          id={`${idPrefix}-password`}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
          required
        />
        {isSignUp && (
          <p className="text-xs text-muted-foreground">
            {t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH })}
          </p>
        )}
      </div>

      {isSignUp && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-confirm-password`}>{t('auth.confirmPassword')}</Label>
          <PasswordInput
            id={`${idPrefix}-confirm-password`}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
      )}

      {message && (
        <div
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={
            message.kind === 'error'
              ? 'flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
              : 'flex items-start gap-2 rounded-md border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300'
          }
        >
          {message.kind === 'error' ? (
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle className="animate-spin" aria-hidden />}
        {isSignUp ? t('auth.signUpAction') : t('auth.signInAction')}
      </Button>
    </form>
  )
}

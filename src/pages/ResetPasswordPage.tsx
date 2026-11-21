import { useEffect, useState, type FormEvent } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { paths } from '@/app/paths'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { updatePassword } from '@/services/authService'
import { getAuthErrorKey } from '@/utils/authErrors'

/** Matches Supabase's default minimum password length (same as sign up). */
const MIN_PASSWORD_LENGTH = 6

/**
 * Supabase puts errors from an expired or reused recovery link in the URL
 * (e.g. `#error=access_denied&error_code=otp_expired`). Read once, on arrival.
 */
function hasLinkError(): boolean {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  return hash.has('error') || hash.has('error_code') || query.has('error') || query.has('error_code')
}

/**
 * Where the recovery email link lands. Supabase turns the link into a temporary
 * session (see AuthProvider), and this page lets the user pick a new password.
 * It sits outside the route guards: the session must not bounce the user to the
 * library first, and a missing session should explain the link expired.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation()
  const { session, isLoading } = useAuth()
  const [linkError] = useState(hasLinkError)

  // Supabase reads the recovery token from the URL and erases it, but leaves a bare "#".
  // Once it's done (auth no longer loading), drop that leftover for a clean address.
  useEffect(() => {
    if (!isLoading && window.location.href.endsWith('#')) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <AuthShell>
        <div className="flex justify-center py-12">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-label={t('common.loading')} />
        </div>
      </AuthShell>
    )
  }

  if (linkError || !session) {
    return (
      <AuthShell>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{t('auth.reset.invalidTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('auth.reset.invalidSubtitle')}</p>
        <Button asChild className="mt-8 w-full">
          <Link to={paths.login} state={{ view: 'forgot' }}>
            {t('auth.reset.requestNewLink')}
          </Link>
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{t('auth.reset.title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('auth.reset.subtitle', { email: session.user.email ?? '' })}
      </p>
      <div className="mt-8">
        <NewPasswordForm />
      </div>
    </AuthShell>
  )
}

function NewPasswordForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.errors.passwordTooShort', { count: MIN_PASSWORD_LENGTH }))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'))
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await updatePassword(password)
      toast.success(t('toast.passwordUpdated'))
      navigate(paths.dashboard, { replace: true })
    } catch (caught) {
      setError(t(getAuthErrorKey(caught)))
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password">{t('auth.reset.newPassword')}</Label>
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground">{t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH })}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-confirm-password">{t('auth.confirmPassword')}</Label>
        <PasswordInput
          id="reset-confirm-password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle className="animate-spin" aria-hidden />}
        {t('auth.reset.action')}
      </Button>
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { CircleAlert, LoaderCircle, MailCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { paths } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/services/authService'
import { getAuthErrorKey } from '@/utils/authErrors'

/**
 * Asks for an email and sends a password recovery link to it. The confirmation is the
 * same whether or not an account exists, so the form can't be used to find out who has one.
 */
export function ForgotPasswordForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await requestPasswordReset(email, `${window.location.origin}${paths.resetPassword}`)
      setSentTo(email.trim())
    } catch (caught) {
      setError(t(getAuthErrorKey(caught)))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <div className="flex size-10 items-center justify-center rounded-full border bg-muted">
          <MailCheck className="size-5" aria-hidden />
        </div>
        <p className="text-sm leading-relaxed">{t('auth.forgot.sent', { email: sentTo })}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{t('auth.forgot.sentHint')}</p>
        <Button variant="outline" className="mt-2 w-full" onClick={() => setSentTo(null)}>
          {t('auth.forgot.tryAgain')}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="auth-forgot-email">{t('auth.email')}</Label>
        <Input
          id="auth-forgot-email"
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
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
        {t('auth.forgot.action')}
      </Button>
    </form>
  )
}

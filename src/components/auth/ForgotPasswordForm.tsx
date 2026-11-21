import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Password recovery request. Design only for now: nothing is sent yet, so submitting
 * just says the feature isn't available. Wire it to Supabase's resetPasswordForEmail later.
 */
export function ForgotPasswordForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [showNotice, setShowNotice] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowNotice(true)
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

      {showNotice && (
        <div role="status" className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t('auth.forgot.unavailable')}
        </div>
      )}

      <Button type="submit" className="mt-2 w-full">
        {t('auth.forgot.action')}
      </Button>
    </form>
  )
}

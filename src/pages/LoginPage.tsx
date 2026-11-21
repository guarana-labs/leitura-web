import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { AuthForm } from '@/components/auth/AuthForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

type AuthView = 'signIn' | 'signUp' | 'forgot'

export function LoginPage() {
  const { t } = useTranslation()
  const location = useLocation()
  // Other pages can open the recovery form directly (e.g. after an expired reset link).
  const [view, setView] = useState<AuthView>(() =>
    (location.state as { view?: AuthView } | null)?.view === 'forgot' ? 'forgot' : 'signIn',
  )

  return (
    <AuthShell>
      {view === 'forgot' && (
        <button
          type="button"
          onClick={() => setView('signIn')}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('auth.forgot.back')}
        </button>
      )}

      <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{t(`auth.views.${view}.title`)}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t(`auth.views.${view}.subtitle`)}</p>

      <div className="mt-8">
        {view === 'forgot' ? (
          <ForgotPasswordForm />
        ) : (
          // Keyed so switching between sign in and sign up starts with a clean form.
          <AuthForm key={view} mode={view} onForgotPassword={() => setView('forgot')} />
        )}
      </div>

      {view !== 'forgot' && (
        <p className="mt-6 text-center text-sm text-muted-foreground lg:text-left">
          {view === 'signIn' ? t('auth.switch.noAccount') : t('auth.switch.hasAccount')}{' '}
          <button
            type="button"
            onClick={() => setView(view === 'signIn' ? 'signUp' : 'signIn')}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {view === 'signIn' ? t('auth.signUpAction') : t('auth.signInAction')}
          </button>
        </p>
      )}
    </AuthShell>
  )
}

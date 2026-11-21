import { useState } from 'react'
import { BookOpen, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthForm } from '@/components/auth/AuthForm'
import { LoginArtwork, LoginFooter } from '@/components/auth/LoginArtwork'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

type AuthView = 'signIn' | 'signUp'

/**
 * Desktop: photo (60%) on the left, an editorial form column (40%) on the right,
 * framed by the wordmark at the top and the quote + photo credit at the bottom.
 * Phones: the photo fills the screen behind a form card.
 */
export function LoginPage() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState<AuthView>('signIn')

  return (
    <div className="relative grid min-h-svh lg:grid-cols-[3fr_2fr]">
      {/* Phones: full-screen background. Desktop: the left column. */}
      <div className="fixed inset-0 lg:relative lg:inset-auto">
        <LoginArtwork className="size-full" />
        <div aria-hidden className="absolute inset-0 bg-black/55 lg:hidden" />
      </div>

      <div className="relative flex min-h-svh flex-col gap-10 px-5 py-5 sm:px-8 lg:bg-background lg:px-14 lg:py-8 xl:px-20">
        <header className="flex items-center justify-between text-white lg:text-foreground">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <BookOpen className="size-5" aria-hidden />
            {t('app.name')}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={t('nav.toggleTheme')}
            className="text-white hover:bg-white/10 hover:text-white lg:text-foreground lg:hover:bg-muted lg:hover:text-foreground"
          >
            {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
          </Button>
        </header>

        <main className="flex flex-1 items-center">
          {/* A card on phones (over the photo); plain column on desktop. */}
          <div className="mx-auto w-full max-w-sm rounded-xl border bg-card p-6 text-card-foreground shadow-lg lg:mx-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{t(`auth.views.${view}.title`)}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t(`auth.views.${view}.subtitle`)}</p>

            <div className="mt-8">
              {/* Keyed so switching between sign in and sign up starts with a clean form. */}
              <AuthForm key={view} mode={view} />
            </div>

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
          </div>
        </main>

        <LoginFooter className="mx-auto w-full max-w-sm lg:mx-0" />
      </div>
    </div>
  )
}

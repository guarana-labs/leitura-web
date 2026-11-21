import { useState, type ReactNode } from 'react'
import { BookOpen, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LoginArtwork, LoginFooter } from '@/components/auth/LoginArtwork'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { getLoginImage } from '@/lib/loginImages'

/**
 * Layout shared by the signed-out pages (login, reset password).
 * Desktop: photo (60%) on the left, an editorial column (40%) on the right,
 * framed by the wordmark at the top and the quote + photo credit at the bottom.
 * Phones: the photo fills the screen behind a card holding `children`.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  // Chosen once per visit, so the photo doesn't change while switching views.
  const [image] = useState(getLoginImage)

  return (
    <div className="relative grid min-h-svh lg:grid-cols-[3fr_2fr]">
      {/* Phones: full-screen background. Desktop: the left column. */}
      <div className="fixed inset-0 lg:relative lg:inset-auto">
        <LoginArtwork image={image} className="size-full" />
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
            {children}
          </div>
        </main>

        <LoginFooter image={image} className="mx-auto w-full max-w-sm lg:mx-0" />
      </div>
    </div>
  )
}

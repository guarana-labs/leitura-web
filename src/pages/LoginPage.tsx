import { useState } from 'react'
import { BookOpen, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthForm, type AuthMode } from '@/components/auth/AuthForm'
import { LoginArtwork, LoginArtworkCaption } from '@/components/auth/LoginArtwork'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/hooks/useTheme'

/**
 * Desktop: photo on the left, form on the right.
 * Phones: the photo fills the screen behind the form, darkened so the form stays readable.
 */
export function LoginPage() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [mode, setMode] = useState<AuthMode>('signIn')

  return (
    <div className="relative grid min-h-svh lg:grid-cols-2">
      {/* Phones: full-screen background. Desktop: the left column. */}
      <div className="fixed inset-0 lg:relative lg:inset-auto">
        <LoginArtwork className="size-full" />
        <div aria-hidden className="absolute inset-0 bg-black/55 lg:hidden" />
        {/* Desktop: soft fade at the bottom so the quote reads without dimming the planet. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-56 bg-gradient-to-t from-black/70 to-transparent lg:block"
        />
        <LoginArtworkCaption className="absolute bottom-8 left-8 hidden lg:block" />
      </div>

      <div className="relative flex min-h-svh flex-col px-4 py-12 lg:bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={t('nav.toggleTheme')}
          className="absolute top-4 right-4 text-white hover:bg-white/10 hover:text-white lg:text-foreground lg:hover:bg-muted lg:hover:text-foreground"
        >
          {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </Button>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="mb-8 flex flex-col items-center text-center text-white lg:text-foreground">
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-card text-card-foreground shadow-sm">
              <BookOpen className="size-5" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('app.name')}</h1>
            <p className="mt-1 text-sm text-white/70 lg:text-muted-foreground">{t('app.tagline')}</p>
          </div>

          <Card className="shadow-lg">
            <CardContent>
              <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)}>
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="signIn">{t('auth.signInTab')}</TabsTrigger>
                  <TabsTrigger value="signUp">{t('auth.signUpTab')}</TabsTrigger>
                </TabsList>
                <TabsContent value="signIn">
                  <AuthForm mode="signIn" />
                </TabsContent>
                <TabsContent value="signUp">
                  <AuthForm mode="signUp" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Phones: quote and credit at the bottom, under the form. */}
        <LoginArtworkCaption className="mx-auto mt-10 w-full lg:hidden" />
      </div>
    </div>
  )
}

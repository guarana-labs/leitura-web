import { useState } from 'react'
import { BookOpen, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthForm, type AuthMode } from '@/components/auth/AuthForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/hooks/useTheme'

export function LoginPage() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [mode, setMode] = useState<AuthMode>('signIn')

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Subtle grid backdrop that fades out towards the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label={t('nav.toggleTheme')}
        className="absolute top-4 right-4"
      >
        {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
      </Button>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-card shadow-sm">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('app.name')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('app.tagline')}</p>
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
    </div>
  )
}

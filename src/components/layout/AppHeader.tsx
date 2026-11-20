import { BookOpen, Moon, Plus, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { UserMenu } from '@/components/layout/UserMenu'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

export function AppHeader() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to={paths.dashboard} className="flex items-center gap-2 font-semibold tracking-tight">
          <BookOpen className="size-5" aria-hidden />
          {t('app.name')}
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm">
            <Link to={paths.importBook}>
              <Plus aria-hidden />
              {t('nav.importBook')}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('nav.toggleTheme')}>
            {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('notFound.title')}</h1>
      <Button asChild variant="outline">
        <Link to={paths.dashboard}>{t('notFound.backHome')}</Link>
      </Button>
    </div>
  )
}

import { FileUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { Button } from '@/components/ui/button'

export function EmptyLibrary() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed px-6 py-16 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-card">
        <FileUp className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="font-medium">{t('dashboard.empty.title')}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('dashboard.empty.description')}</p>
      <Button asChild className="mt-6">
        <Link to={paths.importBook}>{t('nav.importBook')}</Link>
      </Button>
    </div>
  )
}

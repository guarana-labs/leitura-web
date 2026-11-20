import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function FullPageSpinner() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh items-center justify-center" role="status">
      <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}

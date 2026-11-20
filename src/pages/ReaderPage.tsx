import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'

export function ReaderPage() {
  const { t } = useTranslation()
  const { pageNumber } = useParams()

  return (
    <p className="text-sm text-muted-foreground">
      {t('reader.pageOf', { current: Number(pageNumber), total: '—' })}
    </p>
  )
}

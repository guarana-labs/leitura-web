import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'

export function BookDetailsPage() {
  const { t } = useTranslation()
  return <PageHeader title={t('book.title')} />
}

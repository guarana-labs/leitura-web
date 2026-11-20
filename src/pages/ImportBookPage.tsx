import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'

export function ImportBookPage() {
  const { t } = useTranslation()
  return <PageHeader title={t('import.title')} />
}

import { useTranslation } from 'react-i18next'
import { Progress } from '@/components/ui/progress'
import { progressPercent } from '@/utils/format'

interface BookProgressProps {
  currentPage: number | null
  totalPages: number
}

export function BookProgress({ currentPage, totalPages }: BookProgressProps) {
  const { t } = useTranslation()

  if (currentPage === null) {
    return <span className="text-sm text-muted-foreground">{t('books.progress.notStarted')}</span>
  }

  const percent = progressPercent(currentPage, totalPages)

  return (
    <div className="flex min-w-32 items-center gap-3">
      <Progress value={percent} className="h-1.5" aria-label={t('books.progress.label', { percent })} />
      <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">{percent}%</span>
    </div>
  )
}

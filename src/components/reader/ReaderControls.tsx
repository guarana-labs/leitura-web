import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { progressPercent } from '@/utils/format'

interface ReaderControlsProps {
  pageNumber: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

/** Bottom bar: previous / next page and where you are in the book. */
export function ReaderControls({ pageNumber, totalPages, onPrevious, onNext }: ReaderControlsProps) {
  const { t } = useTranslation()
  const percent = progressPercent(pageNumber, totalPages)

  return (
    <nav
      aria-label={t('reader.navigation')}
      className="sticky bottom-0 z-30 border-t bg-background/80 backdrop-blur"
    >
      {/* Thin progress line along the top edge. */}
      <div className="h-0.5 bg-muted" aria-hidden>
        <div className="h-full bg-foreground/60 transition-[width]" style={{ width: `${percent}%` }} />
      </div>

      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-2 sm:px-4">
        <Button variant="ghost" onClick={onPrevious} disabled={pageNumber <= 1}>
          <ChevronLeft aria-hidden />
          <span className="hidden sm:inline">{t('reader.previous')}</span>
        </Button>

        <p className="font-mono text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {t('reader.pageOf', { current: pageNumber, total: totalPages })}
          <span className="hidden sm:inline"> · {percent}%</span>
        </p>

        <Button variant="ghost" onClick={onNext} disabled={pageNumber >= totalPages}>
          <span className="hidden sm:inline">{t('reader.next')}</span>
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  )
}

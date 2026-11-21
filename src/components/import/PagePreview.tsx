import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface PagePreviewProps {
  pageNumber: number
  totalPages: number
  paragraphs: string[]
  onPrevious: () => void
  onNext: () => void
}

/** Lets the user flip through the pages before saving, to check the extraction quality. */
export function PagePreview({ pageNumber, totalPages, paragraphs, onPrevious, onNext }: PagePreviewProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 border-b px-2 py-1.5">
        <span className="flex-1 px-2 text-xs text-muted-foreground">{t('import.preview.label')}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onPrevious}
          disabled={pageNumber <= 1}
          aria-label={t('reader.previous')}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {t('reader.pageOf', { current: pageNumber, total: totalPages })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onNext}
          disabled={pageNumber >= totalPages}
          aria-label={t('reader.next')}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
      <article className="flex max-h-[32rem] flex-col gap-3 overflow-y-auto px-5 py-4 text-[15px] leading-7">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
    </div>
  )
}

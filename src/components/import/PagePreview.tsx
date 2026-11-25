import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BookImage } from '@/components/reader/BookImage'
import { Button } from '@/components/ui/button'
import { pageBlocks } from '@/lib/pagination/pageBlocks'
import type { Page } from '@/lib/pagination/paginate'

interface PagePreviewProps {
  pageNumber: number
  totalPages: number
  page: Page
  /** Local URLs of the book's image files, by key. */
  imageUrls: Map<string, string>
  onPrevious: () => void
  onNext: () => void
}

/** Lets the user flip through the pages before saving, to check the extraction quality. */
export function PagePreview({ pageNumber, totalPages, page, imageUrls, onPrevious, onNext }: PagePreviewProps) {
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
        {pageBlocks(page.paragraphs, page.images).map((block, index) =>
          block.type === 'text' ? (
            <p key={index}>{block.text}</p>
          ) : (
            <BookImage
              key={index}
              url={imageUrls.get(block.image.file) ?? null}
              alt={block.image.alt}
              // Fit inside the preview box, which is shorter than the screen.
              className="[&_img]:max-h-[26rem]"
            />
          ),
        )}
      </article>
    </div>
  )
}

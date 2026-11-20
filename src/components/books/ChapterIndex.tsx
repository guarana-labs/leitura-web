import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { cn } from '@/lib/utils'
import type { Chapter } from '@/types/book'
import { formatNumber } from '@/utils/format'

interface ChapterIndexProps {
  bookId: string
  chapters: Chapter[]
  /** Last page read, used to highlight the chapter the reader is in. */
  currentPage: number | null
  /** Narrow layout (e.g. inside the reader's side panel): hides the word counts. */
  compact?: boolean
  /** Called when a chapter is clicked, e.g. to close the side panel. */
  onNavigate?: () => void
}

/** The book's index: each chapter with the range of pages it covers. Click to start reading there. */
export function ChapterIndex({ bookId, chapters, currentPage, compact = false, onNavigate }: ChapterIndexProps) {
  const { t } = useTranslation()

  return (
    <ol className="divide-y overflow-hidden rounded-lg border">
      {chapters.map((chapter) => {
        const isCurrent = currentPage !== null && currentPage >= chapter.firstPage && currentPage <= chapter.lastPage
        const pageRange =
          chapter.firstPage === chapter.lastPage
            ? t('book.index.page', { page: chapter.firstPage })
            : t('book.index.pages', { first: chapter.firstPage, last: chapter.lastPage })

        return (
          <li key={chapter.id}>
            <Link
              to={paths.reader(bookId, isCurrent && currentPage ? currentPage : chapter.firstPage)}
              onClick={onNavigate}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50',
                isCurrent && 'bg-muted/40',
              )}
            >
              <span className="flex-1 font-medium">{t('chapter.label', { number: chapter.position })}</span>
              {isCurrent && (
                <span className="rounded-full border border-ring/40 bg-ring/10 px-2 py-0.5 text-xs text-link">
                  {t('book.index.reading')}
                </span>
              )}
              <span
                className={cn(
                  'hidden w-32 text-right font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums',
                  !compact && 'sm:block',
                )}
              >
                {t('book.index.words', { count: chapter.wordCount, formatted: formatNumber(chapter.wordCount) })}
              </span>
              <span className="w-28 text-right font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {pageRange}
              </span>
              <ChevronRight
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

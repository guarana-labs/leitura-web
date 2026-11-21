import { useEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { cn } from '@/lib/utils'
import type { PageSummary } from '@/types/book'
import { formatNumber } from '@/utils/format'

interface PageIndexProps {
  bookId: string
  pages: PageSummary[]
  /** Last page read, highlighted as "Lendo". */
  currentPage: number | null
  /** Narrow layout (e.g. inside the reader's side panel): hides the word counts. */
  compact?: boolean
  /** Scroll the current page into view when shown (useful in long lists). */
  scrollToCurrent?: boolean
  /** Called when a page is clicked, e.g. to close the side panel. */
  onNavigate?: () => void
}

/** The book's index: every page, with its word count. Click to read from there. */
export function PageIndex({
  bookId,
  pages,
  currentPage,
  compact = false,
  scrollToCurrent = false,
  onNavigate,
}: PageIndexProps) {
  const { t } = useTranslation()
  const currentRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (scrollToCurrent) currentRef.current?.scrollIntoView({ block: 'center' })
  }, [scrollToCurrent])

  return (
    <ol className="divide-y overflow-hidden rounded-lg border">
      {pages.map((page) => {
        const isCurrent = page.pageNumber === currentPage

        return (
          <li key={page.pageNumber}>
            <Link
              ref={isCurrent ? currentRef : undefined}
              to={paths.reader(bookId, page.pageNumber)}
              onClick={onNavigate}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50',
                isCurrent && 'bg-muted/40',
              )}
            >
              <span className="flex-1 font-medium">{t('page.label', { number: page.pageNumber })}</span>
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
                {t('book.index.words', { count: page.wordCount, formatted: formatNumber(page.wordCount) })}
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

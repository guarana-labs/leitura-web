import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageIndex } from '@/components/books/PageIndex'
import { Button } from '@/components/ui/button'
import type { PageSummary } from '@/types/book'
import { formatNumber } from '@/utils/format'

const PAGES_PER_GROUP = 10

interface PaginatedPageIndexProps {
  bookId: string
  pages: PageSummary[]
  currentPage: number | null
}

/**
 * The book's index split into groups of pages, so long books don't become an endless list.
 * Opens on the group that holds the page being read.
 */
export function PaginatedPageIndex({ bookId, pages, currentPage }: PaginatedPageIndexProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const groupCount = Math.max(1, Math.ceil(pages.length / PAGES_PER_GROUP))

  const [group, setGroup] = useState(() => {
    const index = pages.findIndex((page) => page.pageNumber === currentPage)
    return index === -1 ? 0 : Math.floor(index / PAGES_PER_GROUP)
  })
  const safeGroup = Math.min(group, groupCount - 1)

  const start = safeGroup * PAGES_PER_GROUP
  const visiblePages = pages.slice(start, start + PAGES_PER_GROUP)

  const goToGroup = (target: number) => {
    setGroup(Math.min(Math.max(0, target), groupCount - 1))
    // If the top of the list has scrolled away (or under the sticky header), bring it back so the
    // new group reads from the start.
    const container = containerRef.current
    if (container && container.getBoundingClientRect().top < parseFloat(getComputedStyle(container).scrollMarginTop)) {
      container.scrollIntoView({ block: 'start' })
    }
  }

  if (groupCount <= 1) {
    return <PageIndex bookId={bookId} pages={pages} currentPage={currentPage} />
  }

  const isFirst = safeGroup === 0
  const isLast = safeGroup === groupCount - 1

  return (
    <div ref={containerRef} className="flex scroll-mt-20 flex-col gap-3">
      <PageIndex bookId={bookId} pages={visiblePages} currentPage={currentPage} />

      <nav aria-label={t('book.index.pagination')} className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToGroup(0)}
            disabled={isFirst}
            aria-label={t('book.index.first')}
          >
            <ChevronsLeft aria-hidden />
          </Button>
          <Button
            variant="ghost"
            onClick={() => goToGroup(safeGroup - 1)}
            disabled={isFirst}
            aria-label={t('book.index.previous')}
          >
            <ChevronLeft aria-hidden />
            <span className="hidden sm:inline">{t('book.index.previous')}</span>
          </Button>
        </div>

        <p className="font-mono text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {t('book.index.range', {
            from: formatNumber(visiblePages[0].pageNumber),
            to: formatNumber(visiblePages[visiblePages.length - 1].pageNumber),
            total: formatNumber(pages.length),
          })}
        </p>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => goToGroup(safeGroup + 1)}
            disabled={isLast}
            aria-label={t('book.index.next')}
          >
            <span className="hidden sm:inline">{t('book.index.next')}</span>
            <ChevronRight aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToGroup(groupCount - 1)}
            disabled={isLast}
            aria-label={t('book.index.last')}
          >
            <ChevronsRight aria-hidden />
          </Button>
        </div>
      </nav>
    </div>
  )
}

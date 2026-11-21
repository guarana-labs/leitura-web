import { useState } from 'react'
import { ListOrdered } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageIndex } from '@/components/books/PageIndex'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageSummaries } from '@/hooks/useReader'

interface PageIndexSheetProps {
  bookId: string
  bookTitle: string
  currentPage: number
}

/** Side panel with the book's index, to jump to another page while reading. */
export function PageIndexSheet({ bookId, bookTitle, currentPage }: PageIndexSheetProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const pagesQuery = usePageSummaries(bookId)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('book.index.title')} title={t('book.index.title')}>
          <ListOrdered aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle>{t('book.index.title')}</SheetTitle>
          <SheetDescription className="truncate">{bookTitle}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {pagesQuery.data ? (
            <PageIndex
              bookId={bookId}
              pages={pagesQuery.data}
              currentPage={currentPage}
              compact
              scrollToCurrent
              onNavigate={() => setIsOpen(false)}
            />
          ) : pagesQuery.isError ? (
            <p className="text-sm text-destructive">{t('book.index.loadError')}</p>
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

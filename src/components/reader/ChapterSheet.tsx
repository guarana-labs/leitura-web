import { useState } from 'react'
import { ListOrdered } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ChapterIndex } from '@/components/books/ChapterIndex'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { Chapter } from '@/types/book'

interface ChapterSheetProps {
  bookId: string
  bookTitle: string
  chapters: Chapter[]
  currentPage: number
}

/** Side panel with the book's index, to jump to another chapter while reading. */
export function ChapterSheet({ bookId, bookTitle, chapters, currentPage }: ChapterSheetProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('reader.chapters')} title={t('reader.chapters')}>
          <ListOrdered aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle>{t('book.index.title')}</SheetTitle>
          <SheetDescription className="truncate">{bookTitle}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <ChapterIndex
            bookId={bookId}
            chapters={chapters}
            currentPage={currentPage}
            compact
            onNavigate={() => setIsOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

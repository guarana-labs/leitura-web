import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { BookCover } from '@/components/books/BookCover'
import { BookProgress } from '@/components/books/BookProgress'
import { BookRowActions } from '@/components/books/BookRowActions'
import { DeleteBookDialog } from '@/components/books/DeleteBookDialog'
import { EditBookDialog } from '@/components/books/EditBookDialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { BookSummary } from '@/types/book'

const GRID_CLASSES = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'

interface BooksGridProps {
  books: BookSummary[]
}

/** The library as a grid of covers. Clicking a cover or title opens the book page. */
export function BooksGrid({ books }: BooksGridProps) {
  const { t } = useTranslation()
  const [bookToDelete, setBookToDelete] = useState<BookSummary | null>(null)
  // The book stays set after closing, so the dialog keeps its content during the close animation.
  const [bookToEdit, setBookToEdit] = useState<BookSummary | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  function openEdit(book: BookSummary) {
    setBookToEdit(book)
    setIsEditOpen(true)
  }

  return (
    <>
      <ul className={GRID_CLASSES}>
        {books.map((book) => (
          <li key={book.id} className="flex min-w-0 flex-col gap-3">
            {/* Decorative duplicate of the title link below, so it's skipped by keyboard and screen readers. */}
            <Link to={paths.book(book.id)} tabIndex={-1} aria-hidden className="group block">
              <BookCover
                title={book.title}
                url={book.coverUrl}
                className="w-full rounded-md shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md"
              />
            </Link>

            <div className="flex items-start gap-1">
              <div className="min-w-0 flex-1">
                <Link to={paths.book(book.id)} className="line-clamp-2 text-sm leading-snug font-medium hover:underline">
                  {book.title}
                </Link>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {book.author ?? t('books.unknownAuthor')}
                </p>
              </div>
              <div className="-mt-1.5 -mr-2">
                <BookRowActions book={book} onEdit={openEdit} onDelete={setBookToDelete} />
              </div>
            </div>

            {/* mt-auto lines progress bars up across a row, even when a title wraps to two lines. */}
            <div className="mt-auto">
              <BookProgress currentPage={book.currentPage} totalPages={book.totalPages} />
            </div>
          </li>
        ))}
      </ul>

      {bookToEdit && <EditBookDialog book={bookToEdit} open={isEditOpen} onOpenChange={setIsEditOpen} />}
      <DeleteBookDialog book={bookToDelete} onClose={() => setBookToDelete(null)} />
    </>
  )
}

/** Placeholder covers shown while the library loads in grid view. */
export function BooksGridSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className={GRID_CLASSES} aria-hidden>
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-[2/3] w-full rounded-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

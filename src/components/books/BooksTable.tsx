import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { paths } from '@/app/paths'
import { BookCover } from '@/components/books/BookCover'
import { BookProgress } from '@/components/books/BookProgress'
import { BookRowActions } from '@/components/books/BookRowActions'
import { DeleteBookDialog } from '@/components/books/DeleteBookDialog'
import { EditBookDialog } from '@/components/books/EditBookDialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { BookSummary } from '@/types/book'
import { formatDate, formatNumber, formatRelativeTime } from '@/utils/format'

interface BooksTableProps {
  books: BookSummary[]
}

/** The library table. Clicking a row opens the book page. */
export function BooksTable({ books }: BooksTableProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">{t('books.columns.book')}</TableHead>
              <TableHead className="hidden w-48 sm:table-cell">{t('books.columns.progress')}</TableHead>
              <TableHead className="hidden text-right md:table-cell">{t('books.columns.pages')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('books.columns.lastRead')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('books.columns.addedAt')}</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">{t('books.columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id} className="cursor-pointer" onClick={() => navigate(paths.book(book.id))}>
                {/* w-full + max-w-0 lets the cell shrink, so long titles truncate instead of widening the table. */}
                <TableCell className="w-full max-w-0 pl-4">
                  <div className="flex items-center gap-3">
                    <BookCover title={book.title} url={book.coverUrl} className="w-10" />
                    <div className="min-w-0 flex-1">
                      {/* A real link keeps keyboard and middle-click navigation working. */}
                      <Link
                        to={paths.book(book.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="block truncate font-medium hover:underline"
                      >
                        {book.title}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">{book.author ?? t('books.unknownAuthor')}</p>
                      {/* On phones the progress column is hidden, so progress is shown here instead. */}
                      <div className="mt-1.5 sm:hidden">
                        <BookProgress currentPage={book.currentPage} totalPages={book.totalPages} />
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <BookProgress currentPage={book.currentPage} totalPages={book.totalPages} />
                </TableCell>
                <TableCell className="hidden text-right font-mono text-sm text-muted-foreground tabular-nums md:table-cell">
                  {formatNumber(book.totalPages)}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {book.lastReadAt ? formatRelativeTime(book.lastReadAt) : '—'}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {formatDate(book.createdAt)}
                </TableCell>
                <TableCell className="pr-2">
                  <BookRowActions book={book} onEdit={openEdit} onDelete={setBookToDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {bookToEdit && <EditBookDialog book={bookToEdit} open={isEditOpen} onOpenChange={setIsEditOpen} />}
      <DeleteBookDialog book={bookToDelete} onClose={() => setBookToDelete(null)} />
    </>
  )
}

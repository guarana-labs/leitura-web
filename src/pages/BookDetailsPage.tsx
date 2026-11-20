import { useState } from 'react'
import { ArrowLeft, CircleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/paths'
import { BookInfo } from '@/components/books/BookInfo'
import { ChapterIndex } from '@/components/books/ChapterIndex'
import { DeleteBookDialog } from '@/components/books/DeleteBookDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBook, useChapters } from '@/hooks/useBooks'

export function BookDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { bookId = '' } = useParams()
  const bookQuery = useBook(bookId)
  const chaptersQuery = useChapters(bookId)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const book = bookQuery.data

  return (
    <div className="flex flex-col gap-8">
      <Link
        to={paths.dashboard}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('nav.library')}
      </Link>

      {bookQuery.isPending ? (
        <BookDetailsSkeleton />
      ) : bookQuery.isError ? (
        <ErrorState message={t('book.loadError')} onRetry={() => void bookQuery.refetch()} />
      ) : !book ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-medium">{t('book.notFound')}</p>
          <Button asChild variant="outline" size="sm">
            <Link to={paths.dashboard}>{t('notFound.backHome')}</Link>
          </Button>
        </div>
      ) : (
        <>
          <BookInfo book={book} onDelete={() => setIsDeleteOpen(true)} />

          {book.description && (
            <section className="max-w-prose">
              <h2 className="mb-2 text-sm font-medium">{t('book.description')}</h2>
              <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">{book.description}</p>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">{t('book.index.title')}</h2>
            {chaptersQuery.isPending ? (
              <Skeleton className="h-48 w-full" />
            ) : chaptersQuery.isError ? (
              <ErrorState message={t('book.index.loadError')} onRetry={() => void chaptersQuery.refetch()} />
            ) : (
              <ChapterIndex bookId={book.id} chapters={chaptersQuery.data} currentPage={book.currentPage} />
            )}
          </section>

          <DeleteBookDialog
            book={isDeleteOpen ? book : null}
            onClose={() => setIsDeleteOpen(false)}
            onDeleted={() => navigate(paths.dashboard, { replace: true })}
          />
        </>
      )}
    </div>
  )
}

function BookDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end" aria-hidden>
      <Skeleton className="aspect-[2/3] w-36 sm:w-44" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="mt-4 h-9 w-40" />
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
    >
      <CircleAlert className="size-5 text-destructive" aria-hidden />
      <p className="text-sm">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t('common.retry')}
      </Button>
    </div>
  )
}

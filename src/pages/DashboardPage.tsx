import { CircleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BooksGrid, BooksGridSkeleton } from '@/components/books/BooksGrid'
import { BooksTable } from '@/components/books/BooksTable'
import { BooksTableSkeleton } from '@/components/books/BooksTableSkeleton'
import { EmptyLibrary } from '@/components/books/EmptyLibrary'
import { LibraryViewToggle } from '@/components/books/LibraryViewToggle'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useBooks } from '@/hooks/useBooks'
import { useLibraryView } from '@/hooks/useLibraryView'

export function DashboardPage() {
  const { t } = useTranslation()
  const { data: books, isPending, isError, refetch, isRefetching } = useBooks()
  const { view, setView } = useLibraryView()

  const hasBooks = books !== undefined && books.length > 0
  const description = hasBooks ? t('dashboard.bookCount', { count: books.length }) : undefined

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        description={description}
        actions={hasBooks && <LibraryViewToggle value={view} onChange={setView} />}
      />

      {isPending ? (
        view === 'grid' ? (
          <BooksGridSkeleton />
        ) : (
          <BooksTableSkeleton />
        )
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
        >
          <CircleAlert className="size-5 text-destructive" aria-hidden />
          <p className="text-sm">{t('dashboard.loadError')}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isRefetching}>
            {t('common.retry')}
          </Button>
        </div>
      ) : books.length === 0 ? (
        <EmptyLibrary />
      ) : view === 'grid' ? (
        <BooksGrid books={books} />
      ) : (
        <BooksTable books={books} />
      )}
    </>
  )
}

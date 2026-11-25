import { useCallback, useEffect, useRef } from 'react'
import { CircleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/paths'
import { FullPageSpinner } from '@/components/layout/FullPageSpinner'
import { ReaderControls } from '@/components/reader/ReaderControls'
import { ReaderPageSkeleton, ReaderPageView } from '@/components/reader/ReaderPageView'
import { ReaderTopBar } from '@/components/reader/ReaderTopBar'
import { Button } from '@/components/ui/button'
import { useBook } from '@/hooks/useBooks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useKeyboardPaging } from '@/hooks/useKeyboardPaging'
import { useBookImageUrls, usePage, usePrefetchPages, useSaveProgress } from '@/hooks/useReader'
import { useReaderSettings } from '@/hooks/useReaderSettings'
import { useReaderThemeClass } from '@/hooks/useReaderThemeClass'
import { readerFontFamily } from '@/lib/readerFonts'

/**
 * Reads one page at a time: only the current page is loaded (plus its neighbours
 * in the background), so even very long books never load all at once.
 */
export function ReaderPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { bookId = '', pageNumber: pageParam } = useParams()
  const pageNumber = Number(pageParam)

  const bookQuery = useBook(bookId)
  const pageQuery = usePage(bookId, pageNumber)
  const imageUrlsQuery = useBookImageUrls(pageQuery.data?.images.map((image) => image.path) ?? [])
  const saveProgress = useSaveProgress(bookId)
  const settings = useReaderSettings()
  useReaderThemeClass(settings.readerTheme)

  const book = bookQuery.data
  const totalPages = book?.totalPages ?? 0
  const isValidPage = Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages

  useDocumentTitle(book?.title)

  const goToPage = useCallback(
    (target: number) => {
      if (target < 1 || target > totalPages || target === pageNumber) return
      // Replace, so the browser's back button leaves the reader instead of stepping through pages.
      navigate(paths.reader(bookId, target), { replace: true })
    },
    [navigate, bookId, totalPages, pageNumber],
  )
  const goToPrevious = useCallback(() => goToPage(pageNumber - 1), [goToPage, pageNumber])
  const goToNext = useCallback(() => goToPage(pageNumber + 1), [goToPage, pageNumber])

  useKeyboardPaging(goToPrevious, goToNext)
  usePrefetchPages(bookId, isValidPage ? [pageNumber + 1, pageNumber - 1].filter((n) => n >= 1 && n <= totalPages) : [])

  // Start each page at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pageNumber])

  // Remember this page as the reading position (once per page).
  const savedPageRef = useRef<number | null>(null)
  const { mutate: save } = saveProgress
  useEffect(() => {
    if (!book || !isValidPage || savedPageRef.current === pageNumber) return
    savedPageRef.current = pageNumber
    if (book.currentPage !== pageNumber) save(pageNumber)
  }, [book, isValidPage, pageNumber, save])

  if (bookQuery.isPending) return <FullPageSpinner />

  if (bookQuery.isError || !book) {
    return (
      <CenteredMessage
        message={bookQuery.isError ? t('book.loadError') : t('book.notFound')}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to={paths.dashboard}>{t('notFound.backHome')}</Link>
          </Button>
        }
      />
    )
  }

  // Out-of-range or malformed page numbers go to the nearest valid page.
  if (!isValidPage) {
    const fallback = Number.isFinite(pageNumber) ? Math.min(Math.max(1, Math.round(pageNumber)), totalPages) : 1
    return <Navigate to={paths.reader(bookId, fallback)} replace />
  }

  return (
    <div className="flex min-h-svh flex-col">
      <ReaderTopBar
        bookId={book.id}
        bookTitle={book.title}
        currentPage={pageNumber}
        font={settings.font}
        onFontChange={settings.setFont}
        readerTheme={settings.readerTheme}
        onReaderThemeChange={settings.setReaderTheme}
        canDecreaseFont={settings.canDecrease}
        canIncreaseFont={settings.canIncrease}
        onDecreaseFont={settings.decreaseFontSize}
        onIncreaseFont={settings.increaseFontSize}
      />

      <main className="w-full flex-1 px-5 py-10 sm:px-8 sm:py-14">
        {pageQuery.isPending ? (
          <ReaderPageSkeleton />
        ) : pageQuery.isError || !pageQuery.data ? (
          <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
            <CircleAlert className="size-5 text-destructive" aria-hidden />
            <p className="text-sm">{t('reader.loadError')}</p>
            <Button variant="outline" size="sm" onClick={() => void pageQuery.refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <ReaderPageView
            paragraphs={pageQuery.data.paragraphs}
            images={pageQuery.data.images}
            imageUrls={imageUrlsQuery.data}
            fontSize={settings.fontSize}
            fontFamily={readerFontFamily(settings.font)}
            isLastPage={pageNumber === totalPages}
          />
        )}
      </main>

      <ReaderControls pageNumber={pageNumber} totalPages={totalPages} onPrevious={goToPrevious} onNext={goToNext} />
    </div>
  )
}

function CenteredMessage({ message, action }: { message: string; action: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="font-medium">{message}</p>
      {action}
    </div>
  )
}

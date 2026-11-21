import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { PageIndexSheet } from '@/components/reader/PageIndexSheet'
import { ReaderFontMenu } from '@/components/reader/ReaderFontMenu'
import { ReaderThemeMenu } from '@/components/reader/ReaderThemeMenu'
import { Button } from '@/components/ui/button'
import type { ReaderFontId } from '@/lib/readerFonts'
import type { ReaderThemeId } from '@/lib/readerThemes'

interface ReaderTopBarProps {
  bookId: string
  bookTitle: string
  currentPage: number
  font: ReaderFontId
  onFontChange: (font: ReaderFontId) => void
  readerTheme: ReaderThemeId
  onReaderThemeChange: (theme: ReaderThemeId) => void
  canDecreaseFont: boolean
  canIncreaseFont: boolean
  onDecreaseFont: () => void
  onIncreaseFont: () => void
}

/** Minimal header for reading: back to the book, where you are, and reading preferences. */
export function ReaderTopBar({
  bookId,
  bookTitle,
  currentPage,
  font,
  onFontChange,
  readerTheme,
  onReaderThemeChange,
  canDecreaseFont,
  canIncreaseFont,
  onDecreaseFont,
  onIncreaseFont,
}: ReaderTopBarProps) {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-2 sm:px-4">
        <Button asChild variant="ghost" size="icon" aria-label={t('reader.backToBook')} title={t('reader.backToBook')}>
          <Link to={paths.book(bookId)}>
            <ArrowLeft aria-hidden />
          </Link>
        </Button>

        <p className="min-w-0 flex-1 truncate text-sm font-medium">{bookTitle}</p>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onDecreaseFont}
            disabled={!canDecreaseFont}
            aria-label={t('reader.decreaseFont')}
            title={t('reader.decreaseFont')}
          >
            <Minus aria-hidden />
          </Button>
          <ReaderFontMenu value={font} onChange={onFontChange} />
          <Button
            variant="ghost"
            size="icon"
            onClick={onIncreaseFont}
            disabled={!canIncreaseFont}
            aria-label={t('reader.increaseFont')}
            title={t('reader.increaseFont')}
          >
            <Plus aria-hidden />
          </Button>
          <ReaderThemeMenu value={readerTheme} onChange={onReaderThemeChange} />
          <PageIndexSheet bookId={bookId} bookTitle={bookTitle} currentPage={currentPage} />
        </div>
      </div>
    </header>
  )
}

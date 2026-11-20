import { BookOpenText, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { BookCover } from '@/components/books/BookCover'
import { BookProgress } from '@/components/books/BookProgress'
import { Button } from '@/components/ui/button'
import { nativeLanguageName, OTHER_LANGUAGE } from '@/lib/languages'
import type { BookSummary } from '@/types/book'
import { formatDate, formatNumber } from '@/utils/format'

interface BookInfoProps {
  book: BookSummary
  onEdit: () => void
  onDelete: () => void
}

/** Top of the book page: cover, title, author, facts, progress and actions. */
export function BookInfo({ book, onEdit, onDelete }: BookInfoProps) {
  const { t } = useTranslation()

  const language = book.language === OTHER_LANGUAGE ? t('languages.other') : nativeLanguageName(book.language ?? '')
  const facts = [
    language,
    t('book.facts.pages', { count: book.totalPages, formatted: formatNumber(book.totalPages) }),
    t('book.facts.chapters', { count: book.totalChapters, formatted: formatNumber(book.totalChapters) }),
    t('book.facts.words', { count: book.totalWords, formatted: formatNumber(book.totalWords) }),
    t('book.facts.addedAt', { date: formatDate(book.createdAt) }),
  ].filter(Boolean)

  return (
    <section className="flex flex-col gap-6 sm:flex-row sm:items-end">
      <BookCover title={book.title} url={book.coverUrl} className="w-36 sm:w-44" />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{book.title}</h1>
          <p className="mt-1 text-muted-foreground">{book.author ?? t('books.unknownAuthor')}</p>
        </div>

        <ul className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {facts.map((fact, index) => (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden>·</span>}
              {fact}
            </li>
          ))}
        </ul>

        <div className="flex max-w-sm flex-col gap-1.5">
          <BookProgress currentPage={book.currentPage} totalPages={book.totalPages} />
          {book.currentPage !== null && (
            <p className="text-xs text-muted-foreground">
              {t('reader.pageOf', { current: book.currentPage, total: book.totalPages })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={paths.reader(book.id, book.currentPage ?? 1)}>
              <BookOpenText aria-hidden />
              {book.currentPage ? t('books.actions.continue') : t('books.actions.start')}
            </Link>
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Pencil aria-hidden />
            {t('book.edit.action')}
          </Button>
          <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 aria-hidden />
            {t('books.actions.delete')}
          </Button>
        </div>
      </div>
    </section>
  )
}

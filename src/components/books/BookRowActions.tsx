import { BookOpenText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { BookSummary } from '@/types/book'

interface BookRowActionsProps {
  book: BookSummary
  onEdit: (book: BookSummary) => void
  onDelete: (book: BookSummary) => void
}

export function BookRowActions({ book, onEdit, onDelete }: BookRowActionsProps) {
  const { t } = useTranslation()

  return (
    // Stop clicks from reaching the row, which would open the book page.
    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      {/* Non-modal, so opening the edit or delete dialog from it doesn't immediately close the dialog again. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('books.actions.menu', { title: book.title })}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to={paths.reader(book.id, book.currentPage ?? 1)}>
              <BookOpenText aria-hidden />
              {book.currentPage ? t('books.actions.continue') : t('books.actions.start')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(book)}>
            <Pencil aria-hidden />
            {t('books.actions.edit')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(book)}>
            <Trash2 aria-hidden />
            {t('books.actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

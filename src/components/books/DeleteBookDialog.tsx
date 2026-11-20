import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDeleteBook } from '@/hooks/useBooks'
import type { Book } from '@/types/book'

interface DeleteBookDialogProps {
  /** The book to delete; the dialog is open while this is set. */
  book: Pick<Book, 'id' | 'title' | 'coverPath'> | null
  onClose: () => void
}

export function DeleteBookDialog({ book, onClose }: DeleteBookDialogProps) {
  const { t } = useTranslation()
  const deleteMutation = useDeleteBook()
  // Keep showing the last book while the dialog animates closed (when `book` is already null).
  const [shownBook, setShownBook] = useState(book)
  if (book !== null && book !== shownBook) setShownBook(book)

  function handleOpenChange(open: boolean) {
    if (!open && !deleteMutation.isPending) {
      deleteMutation.reset()
      onClose()
    }
  }

  function handleConfirm() {
    if (!book) return
    deleteMutation.mutate(book, {
      onSuccess: () => {
        deleteMutation.reset()
        onClose()
      },
    })
  }

  return (
    <AlertDialog open={book !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('books.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('books.delete.description', { title: shownBook?.title ?? '' })}</AlertDialogDescription>
        </AlertDialogHeader>

        {deleteMutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t('books.delete.error')}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
          {/* A plain button (not AlertDialogAction) so the dialog stays open until the delete finishes. */}
          <Button variant="destructive" onClick={handleConfirm} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t('books.delete.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

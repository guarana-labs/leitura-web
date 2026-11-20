import { useState, type FormEvent } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BookMetadataFields, type BookMetadataValues } from '@/components/books/BookMetadataFields'
import { CoverPicker, type CoverState } from '@/components/books/CoverPicker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUpdateBook } from '@/hooks/useBooks'
import { toBookLanguage } from '@/lib/languages'
import type { CoverUpdate } from '@/services/bookService'
import type { BookSummary } from '@/types/book'

interface EditBookDialogProps {
  book: BookSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Edits a book's details and cover. The book's text is never touched. */
export function EditBookDialog({ book, open, onOpenChange }: EditBookDialogProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateBook()

  function handleOpenChange(next: boolean) {
    if (updateMutation.isPending) return
    if (!next) updateMutation.reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('book.edit.title')}</DialogTitle>
          <DialogDescription>{t('book.edit.description')}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form always starts from the book's current values. */}
        {open && (
          <EditBookForm
            book={book}
            isSaving={updateMutation.isPending}
            error={
              updateMutation.error === null
                ? null
                : updateMutation.error.name === 'CoverUploadError'
                  ? t('book.edit.coverError')
                  : t('book.edit.error')
            }
            onCancel={() => handleOpenChange(false)}
            onSubmit={(metadata, cover) =>
              updateMutation.mutate(
                { book, metadata, cover },
                {
                  onSuccess: () => {
                    updateMutation.reset()
                    onOpenChange(false)
                    toast.success(t('toast.updated', { title: metadata.title }))
                  },
                },
              )
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface EditBookFormProps {
  book: BookSummary
  isSaving: boolean
  error: string | null
  onCancel: () => void
  onSubmit: (
    metadata: { title: string; author: string | null; description: string | null; language: string },
    cover: CoverUpdate,
  ) => void
}

function EditBookForm({ book, isSaving, error, onCancel, onSubmit }: EditBookFormProps) {
  const { t } = useTranslation()
  const [values, setValues] = useState<BookMetadataValues>({
    title: book.title,
    author: book.author ?? '',
    language: toBookLanguage(book.language),
    description: book.description ?? '',
  })
  const [cover, setCover] = useState<CoverState>(
    book.coverPath ? { type: 'existing', url: book.coverUrl ?? '' } : { type: 'none' },
  )
  const [showErrors, setShowErrors] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (values.title.trim() === '') {
      setShowErrors(true)
      return
    }
    onSubmit(
      {
        title: values.title.trim(),
        author: values.author.trim() || null,
        description: values.description.trim() || null,
        language: values.language,
      },
      toCoverUpdate(cover, book.coverPath),
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <CoverPicker title={values.title} value={cover} onChange={setCover} />
      <BookMetadataFields
        idPrefix="edit-book"
        values={values}
        onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
        showErrors={showErrors}
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <LoaderCircle className="animate-spin" aria-hidden />}
          {isSaving ? t('book.edit.saving') : t('book.edit.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}

function toCoverUpdate(cover: CoverState, currentPath: string | null): CoverUpdate {
  if (cover.type === 'new') return { type: 'replace', blob: cover.blob }
  if (cover.type === 'none' && currentPath) return { type: 'remove' }
  return { type: 'keep' }
}

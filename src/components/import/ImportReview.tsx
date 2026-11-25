import { useMemo, useState, type FormEvent } from 'react'
import { CircleAlert, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BookMetadataFields } from '@/components/books/BookMetadataFields'
import { CoverPicker } from '@/components/books/CoverPicker'
import { PagePreview } from '@/components/import/PagePreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isImageBlock, type SourceBlock } from '@/lib/import/sourceBook'
import type { BookLanguage } from '@/lib/languages'
import { paginateSections } from '@/lib/pagination/paginate'
import { cn } from '@/lib/utils'
import type { BookImport } from '@/types/book'
import { formatNumber } from '@/utils/format'
import { countWords } from '@/utils/words'

export interface ImportDraft {
  fileName: string
  title: string
  author: string
  description: string
  language: BookLanguage
  wordsPerPage: number
  /** The extracted content; see SourceBook.sections. */
  sections: SourceBlock[][]
  /** Image files used in `sections`; see SourceBook.images. */
  images: Map<string, Blob>
  /** Local URLs of `images` for the preview (released by the import page). */
  imageUrls: Map<string, string>
  /** See SourceBook.fixedLayout. */
  fixedLayout: boolean
  cover: Blob | null
}

// Must match the `words_per_page` check constraint in the database.
const MIN_WORDS_PER_PAGE = 50
const MAX_WORDS_PER_PAGE = 5000

interface ImportReviewProps {
  draft: ImportDraft
  onChange: (draft: ImportDraft) => void
  onCancel: () => void
  onSave: (book: BookImport, cover: Blob | null) => void
  isSaving: boolean
  /** What's happening while saving (e.g. "Enviando imagens 3 de 56…"), when there's more to say than "Salvando…". */
  savingLabel: string | null
  saveError: string | null
}

/** Review step: book details, cover, totals and a preview of the pages. */
export function ImportReview({ draft, onChange, onCancel, onSave, isSaving, savingLabel, saveError }: ImportReviewProps) {
  const { t } = useTranslation()
  const [previewPage, setPreviewPage] = useState(1)
  const [showErrors, setShowErrors] = useState(false)

  const wordsPerPage = clampWordsPerPage(draft.wordsPerPage)

  // Cheap enough to redo whenever the page size changes.
  const pages = useMemo(() => paginateSections(draft.sections, wordsPerPage), [draft.sections, wordsPerPage])
  const totalWords = useMemo(
    () => draft.sections.flat().reduce((sum, block) => sum + (isImageBlock(block) ? 0 : countWords(block)), 0),
    [draft.sections],
  )
  const shownPage = Math.min(previewPage, pages.length)
  const titleMissing = draft.title.trim() === ''
  const wordsPerPageInvalid =
    !Number.isFinite(draft.wordsPerPage) ||
    draft.wordsPerPage < MIN_WORDS_PER_PAGE ||
    draft.wordsPerPage > MAX_WORDS_PER_PAGE

  const update = (changes: Partial<ImportDraft>) => onChange({ ...draft, ...changes })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (titleMissing || wordsPerPageInvalid) {
      setShowErrors(true)
      return
    }
    onSave(
      {
        metadata: {
          title: draft.title.trim(),
          author: draft.author.trim() || undefined,
          description: draft.description.trim() || undefined,
          language: draft.language,
        },
        wordsPerPage,
        pages,
        images: draft.images,
      },
      draft.cover,
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      {/* Left: book details */}
      <section className="flex flex-col gap-5">
        <CoverPicker
          title={draft.title}
          value={draft.cover ? { type: 'new', blob: draft.cover } : { type: 'none' }}
          onChange={(cover) => update({ cover: cover.type === 'new' ? cover.blob : null })}
        />

        <BookMetadataFields idPrefix="import" values={draft} onChange={update} showErrors={showErrors} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="import-words-per-page">{t('import.details.wordsPerPage')}</Label>
          <Input
            id="import-words-per-page"
            type="number"
            inputMode="numeric"
            min={MIN_WORDS_PER_PAGE}
            max={MAX_WORDS_PER_PAGE}
            step={50}
            value={Number.isFinite(draft.wordsPerPage) ? draft.wordsPerPage : ''}
            onChange={(event) => update({ wordsPerPage: event.target.valueAsNumber })}
            aria-invalid={wordsPerPageInvalid}
            className="w-32"
          />
          <p className={wordsPerPageInvalid ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
            {t('import.details.wordsPerPageHint', { min: MIN_WORDS_PER_PAGE, max: MAX_WORDS_PER_PAGE })}
          </p>
        </div>
      </section>

      {/* Right: totals and preview */}
      <section className="flex min-w-0 flex-col gap-5">
        {draft.fixedLayout && (
          <div
            role="note"
            className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{t('import.fixedLayout')}</span>
          </div>
        )}

        <dl
          className={cn(
            'grid overflow-hidden rounded-lg border text-center',
            draft.images.size > 0 ? 'grid-cols-3' : 'grid-cols-2',
          )}
        >
          {[
            [t('import.summary.pages'), formatNumber(pages.length)],
            [t('import.summary.words'), formatNumber(totalWords)],
            ...(draft.images.size > 0 ? [[t('import.summary.images'), formatNumber(draft.images.size)]] : []),
          ].map(([label, value]) => (
            <div key={label} className="border-r px-3 py-3 last:border-r-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-mono text-lg font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {pages.length > 0 && (
          <PagePreview
            pageNumber={shownPage}
            totalPages={pages.length}
            page={pages[shownPage - 1]}
            imageUrls={draft.imageUrls}
            onPrevious={() => setPreviewPage(Math.max(1, shownPage - 1))}
            onNext={() => setPreviewPage(Math.min(pages.length, shownPage + 1))}
          />
        )}

        {saveError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <LoaderCircle className="animate-spin" aria-hidden />}
            {isSaving ? (savingLabel ?? t('import.saving')) : t('import.save')}
          </Button>
        </div>
      </section>
    </form>
  )
}

function clampWordsPerPage(value: number): number {
  if (!Number.isFinite(value)) return 400
  return Math.min(MAX_WORDS_PER_PAGE, Math.max(MIN_WORDS_PER_PAGE, Math.round(value)))
}

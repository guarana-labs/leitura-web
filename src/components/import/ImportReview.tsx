import { useMemo, useState, type FormEvent } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSelect } from '@/components/books/LanguageSelect'
import { ChapterList } from '@/components/import/ChapterList'
import { CoverPicker } from '@/components/import/CoverPicker'
import { PagePreview } from '@/components/import/PagePreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { BookLanguage } from '@/lib/languages'
import { paginate } from '@/lib/pagination/paginate'
import type { BookImport } from '@/types/book'
import { formatNumber } from '@/utils/format'
import { countWords } from '@/utils/words'

export interface DraftChapter {
  key: string
  paragraphs: string[]
}

export interface ImportDraft {
  fileName: string
  title: string
  author: string
  description: string
  language: BookLanguage
  wordsPerPage: number
  chapters: DraftChapter[]
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
  saveError: string | null
}

/** Review step: book details, cover, detected chapters and a page preview. */
export function ImportReview({ draft, onChange, onCancel, onSave, isSaving, saveError }: ImportReviewProps) {
  const { t } = useTranslation()
  const [selectedChapter, setSelectedChapter] = useState(0)
  const [showErrors, setShowErrors] = useState(false)

  const wordsPerPage = clampWordsPerPage(draft.wordsPerPage)

  // Paginate every chapter; cheap enough to redo whenever chapters or page size change.
  const paginated = useMemo(
    () =>
      draft.chapters.map((chapter) => ({
        ...chapter,
        pages: paginate(chapter.paragraphs, wordsPerPage),
        wordCount: chapter.paragraphs.reduce((sum, paragraph) => sum + countWords(paragraph), 0),
      })),
    [draft.chapters, wordsPerPage],
  )

  const totals = useMemo(
    () => ({
      words: paginated.reduce((sum, chapter) => sum + chapter.wordCount, 0),
      pages: paginated.reduce((sum, chapter) => sum + chapter.pages.length, 0),
    }),
    [paginated],
  )

  const currentIndex = Math.min(selectedChapter, paginated.length - 1)
  const current = paginated[currentIndex]
  const titleMissing = draft.title.trim() === ''
  const wordsPerPageInvalid =
    !Number.isFinite(draft.wordsPerPage) ||
    draft.wordsPerPage < MIN_WORDS_PER_PAGE ||
    draft.wordsPerPage > MAX_WORDS_PER_PAGE

  const update = (changes: Partial<ImportDraft>) => onChange({ ...draft, ...changes })

  const updateChapters = (chapters: DraftChapter[]) => {
    update({ chapters })
    setSelectedChapter((index) => Math.min(index, chapters.length - 1))
  }

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
        chapters: paginated.map((chapter) => ({ pages: chapter.pages })),
      },
      draft.cover,
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      {/* Left: book details */}
      <section className="flex flex-col gap-5">
        <CoverPicker title={draft.title} cover={draft.cover} onChange={(cover) => update({ cover })} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="import-title">{t('import.details.title')}</Label>
          <Input
            id="import-title"
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
            aria-invalid={showErrors && titleMissing}
            maxLength={500}
            required
          />
          {showErrors && titleMissing && <p className="text-xs text-destructive">{t('import.errors.titleRequired')}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="import-author">
            {t('import.details.author')} <span className="text-muted-foreground">{t('common.optional')}</span>
          </Label>
          <Input
            id="import-author"
            value={draft.author}
            onChange={(event) => update({ author: event.target.value })}
            maxLength={300}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="import-language">{t('import.details.language')}</Label>
          <LanguageSelect id="import-language" value={draft.language} onChange={(language) => update({ language })} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="import-description">
            {t('import.details.description')} <span className="text-muted-foreground">{t('common.optional')}</span>
          </Label>
          <Textarea
            id="import-description"
            value={draft.description}
            onChange={(event) => update({ description: event.target.value })}
            maxLength={5000}
            rows={4}
          />
        </div>

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

      {/* Right: structure and preview */}
      <section className="flex min-w-0 flex-col gap-5">
        <dl className="grid grid-cols-3 overflow-hidden rounded-lg border text-center">
          {[
            [t('import.summary.chapters'), formatNumber(paginated.length)],
            [t('import.summary.pages'), formatNumber(totals.pages)],
            [t('import.summary.words'), formatNumber(totals.words)],
          ].map(([label, value]) => (
            <div key={label} className="border-r px-3 py-3 last:border-r-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-mono text-lg font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">{t('import.chapters.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('import.chapters.hint')}</p>
          <div className="max-h-[22rem] overflow-y-auto">
            <ChapterList
              chapters={paginated.map((chapter) => ({
                key: chapter.key,
                excerpt: excerptOf(chapter.paragraphs),
                wordCount: chapter.wordCount,
                pageCount: chapter.pages.length,
              }))}
              selectedIndex={currentIndex}
              onSelect={setSelectedChapter}
              onMergeWithPrevious={(index) => updateChapters(mergeWithPrevious(draft.chapters, index))}
              onRemove={(index) => updateChapters(draft.chapters.filter((_, i) => i !== index))}
            />
          </div>
        </div>

        {current && <PagePreview chapterNumber={currentIndex + 1} paragraphs={current.pages[0] ?? []} />}

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
            {isSaving ? t('import.saving') : t('import.save')}
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

/** Appends a chapter's paragraphs to the previous chapter (for wrongly detected chapter breaks). */
function mergeWithPrevious(chapters: DraftChapter[], index: number): DraftChapter[] {
  if (index <= 0) return chapters
  const previous = chapters[index - 1]
  const merged: DraftChapter = { ...previous, paragraphs: [...previous.paragraphs, ...chapters[index].paragraphs] }
  return [...chapters.slice(0, index - 1), merged, ...chapters.slice(index + 1)]
}

/** The chapter's first words, so a numbered chapter is still recognizable in the list. */
function excerptOf(paragraphs: string[]): string {
  return paragraphs.join(' ').slice(0, 80)
}

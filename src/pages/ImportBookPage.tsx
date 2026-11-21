import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { paths } from '@/app/paths'
import { BookFileDropzone } from '@/components/import/BookFileDropzone'
import { ExtractionProgress } from '@/components/import/ExtractionProgress'
import { ImportReview, type ImportDraft } from '@/components/import/ImportReview'
import { PageHeader } from '@/components/layout/PageHeader'
import { useImportBook } from '@/hooks/useImportBook'
import { detectBookFileKind, readBookFile } from '@/lib/import/readBookFile'
import { languageFromTag } from '@/lib/languages'
import type { BookImport } from '@/types/book'

const MAX_FILE_BYTES = 100 * 1024 * 1024
const DEFAULT_WORDS_PER_PAGE = 400

type Step =
  | { name: 'select'; error: string | null }
  | { name: 'extracting'; fileName: string; progress: number }
  | { name: 'review'; draft: ImportDraft }

/**
 * Import flow: choose a PDF or EPUB → extract its text in the browser → review → save.
 * Only the extracted text (and an optional cover) is saved; the file is discarded.
 */
export function ImportBookPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const importMutation = useImportBook()
  const [step, setStep] = useState<Step>({ name: 'select', error: null })

  async function handleFile(file: File) {
    const kind = detectBookFileKind(file)
    if (!kind) {
      setStep({ name: 'select', error: t('import.errors.unsupported') })
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setStep({ name: 'select', error: t('import.errors.tooLarge', { size: 100 }) })
      return
    }

    setStep({ name: 'extracting', fileName: file.name, progress: 0 })
    try {
      const book = await readBookFile(file, kind, (progress) =>
        setStep({ name: 'extracting', fileName: file.name, progress }),
      )
      setStep({
        name: 'review',
        draft: {
          fileName: file.name,
          title: book.metadata.title,
          author: book.metadata.author,
          description: '',
          language: languageFromTag(book.metadata.language),
          wordsPerPage: DEFAULT_WORDS_PER_PAGE,
          sections: book.sections,
          cover: null,
        },
      })
    } catch (error) {
      setStep({ name: 'select', error: t(extractionErrorKey(error)) })
    }
  }

  function handleSave(book: BookImport, cover: Blob | null) {
    importMutation.mutate(
      { book, cover },
      {
        onSuccess: ({ coverFailed }) => {
          if (coverFailed) toast.warning(t('toast.importedWithoutCover', { title: book.metadata.title }))
          else toast.success(t('toast.imported', { title: book.metadata.title }))
          navigate(paths.dashboard)
        },
      },
    )
  }

  return (
    <>
      <PageHeader
        title={t('import.title')}
        description={step.name === 'review' ? step.draft.fileName : t('import.subtitle')}
      />

      {step.name === 'select' && (
        <div className="flex flex-col gap-4">
          {step.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{step.error}</span>
            </div>
          )}
          <BookFileDropzone onFile={(file) => void handleFile(file)} />
        </div>
      )}

      {step.name === 'extracting' && <ExtractionProgress fileName={step.fileName} progress={step.progress} />}

      {step.name === 'review' && (
        <ImportReview
          draft={step.draft}
          onChange={(draft) => setStep({ name: 'review', draft })}
          onCancel={() => {
            importMutation.reset()
            setStep({ name: 'select', error: null })
          }}
          onSave={handleSave}
          isSaving={importMutation.isPending}
          saveError={importMutation.isError ? t('import.errors.saveFailed') : null}
        />
      )}
    </>
  )
}

type ExtractionErrorKey = 'import.errors.noText' | 'import.errors.protected' | 'import.errors.unreadable'

function extractionErrorKey(error: unknown): ExtractionErrorKey {
  if (error instanceof Error && error.name === 'NoTextError') return 'import.errors.noText'
  if (error instanceof Error && error.name === 'ProtectedFileError') return 'import.errors.protected'
  return 'import.errors.unreadable'
}

import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { paths } from '@/app/paths'
import { ExtractionProgress } from '@/components/import/ExtractionProgress'
import { ImportReview, type ImportDraft } from '@/components/import/ImportReview'
import { PdfDropzone } from '@/components/import/PdfDropzone'
import { PageHeader } from '@/components/layout/PageHeader'
import { useImportBook } from '@/hooks/useImportBook'
import { DEFAULT_BOOK_LANGUAGE } from '@/lib/languages'
import type { BookImport } from '@/types/book'

const MAX_PDF_BYTES = 100 * 1024 * 1024
const DEFAULT_WORDS_PER_PAGE = 400

type Step =
  | { name: 'select'; error: string | null }
  | { name: 'extracting'; fileName: string; page: number; total: number }
  | { name: 'review'; draft: ImportDraft }

/**
 * Import flow: choose a PDF → extract its text in the browser → review → save.
 * Only the extracted text (and an optional cover) is saved; the PDF is discarded.
 */
export function ImportBookPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const importMutation = useImportBook()
  const [step, setStep] = useState<Step>({ name: 'select', error: null })

  async function handleFile(file: File) {
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      setStep({ name: 'select', error: t('import.errors.notPdf') })
      return
    }
    if (file.size > MAX_PDF_BYTES) {
      setStep({ name: 'select', error: t('import.errors.tooLarge', { size: 100 }) })
      return
    }

    setStep({ name: 'extracting', fileName: file.name, page: 0, total: 0 })
    try {
      // Loaded on demand, so pdf.js is only downloaded when someone imports a book.
      const { readPdfBook } = await import('@/lib/pdf/readPdfBook')
      const book = await readPdfBook(file, (page, total) =>
        setStep({ name: 'extracting', fileName: file.name, page, total }),
      )
      setStep({
        name: 'review',
        draft: {
          fileName: file.name,
          title: book.metadata.title,
          author: book.metadata.author,
          description: '',
          language: DEFAULT_BOOK_LANGUAGE,
          wordsPerPage: DEFAULT_WORDS_PER_PAGE,
          chapters: book.chapters.map((chapter) => ({ ...chapter, key: crypto.randomUUID() })),
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
        onSuccess: () => navigate(paths.dashboard),
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
          <PdfDropzone onFile={(file) => void handleFile(file)} />
        </div>
      )}

      {step.name === 'extracting' && <ExtractionProgress fileName={step.fileName} page={step.page} total={step.total} />}

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

type ExtractionErrorKey = 'import.errors.noText' | 'import.errors.password' | 'import.errors.unreadable'

function extractionErrorKey(error: unknown): ExtractionErrorKey {
  if (error instanceof Error && error.name === 'NoTextLayerError') return 'import.errors.noText'
  if (error instanceof Error && error.name === 'PdfPasswordError') return 'import.errors.password'
  return 'import.errors.unreadable'
}

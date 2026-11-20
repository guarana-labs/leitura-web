import { useTranslation } from 'react-i18next'

interface PagePreviewProps {
  chapterNumber: number
  paragraphs: string[]
}

/** Shows the first page of the selected chapter, to check the extraction quality. */
export function PagePreview({ chapterNumber, paragraphs }: PagePreviewProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-2 text-xs text-muted-foreground">{t('import.preview.label')}</div>
      <article className="max-h-[28rem] overflow-y-auto px-5 py-4">
        <h3 className="mb-3 text-lg font-semibold tracking-tight">{t('chapter.label', { number: chapterNumber })}</h3>
        <div className="flex flex-col gap-3 text-[15px] leading-7">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'

interface ReaderPageViewProps {
  paragraphs: string[]
  fontSize: number
  isLastPage: boolean
}

/** The text of one page, set for comfortable reading. */
export function ReaderPageView({ paragraphs, fontSize, isLastPage }: ReaderPageViewProps) {
  const { t } = useTranslation()

  return (
    <article className="flex flex-col" style={{ fontSize: `${fontSize}px` }}>
      <div className="flex flex-col gap-[1em] leading-[1.8] text-pretty">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {isLastPage && (
        <p className="mt-12 text-center text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {t('reader.end')}
        </p>
      )}
    </article>
  )
}

export function ReaderPageSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: 12 }, (_, index) => (
        <Skeleton key={index} className="h-4" style={{ width: `${index % 4 === 3 ? 60 : 100}%` }} />
      ))}
    </div>
  )
}

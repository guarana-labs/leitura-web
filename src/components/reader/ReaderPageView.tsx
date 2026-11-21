import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'

interface ReaderPageViewProps {
  paragraphs: string[]
  fontSize: number
  /** CSS font-family of the chosen reading font. */
  fontFamily: string
  isLastPage: boolean
}

/** The text of one page, set for comfortable reading. */
export function ReaderPageView({ paragraphs, fontSize, fontFamily, isLastPage }: ReaderPageViewProps) {
  const { t } = useTranslation()

  return (
    // Width in `em` of the reading text, so lines stay ~65 characters (the usual 50–75 range)
    // at every font size. Measured: Literata ≈ 63, Geist ≈ 66, Atkinson ≈ 67 per line.
    // (`ch` was uneven: Literata's wide "0" made its lines much shorter than the sans fonts'.)
    <article className="mx-auto flex w-full max-w-[31em] flex-col" style={{ fontSize: `${fontSize}px`, fontFamily }}>
      <div className="flex flex-col gap-[1em] leading-[1.65] text-pretty">
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
    <div className="mx-auto flex w-full max-w-[42rem] flex-col gap-3" aria-hidden>
      {Array.from({ length: 12 }, (_, index) => (
        <Skeleton key={index} className="h-4" style={{ width: `${index % 4 === 3 ? 60 : 100}%` }} />
      ))}
    </div>
  )
}

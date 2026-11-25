import { useTranslation } from 'react-i18next'
import { BookImage } from '@/components/reader/BookImage'
import { Skeleton } from '@/components/ui/skeleton'
import { pageBlocks } from '@/lib/pagination/pageBlocks'
import type { PageImage } from '@/types/book'

interface ReaderPageViewProps {
  paragraphs: string[]
  images: PageImage[]
  /** Signed URLs of the page's images, by storage path (missing while they load). */
  imageUrls: Map<string, string> | undefined
  fontSize: number
  /** CSS font-family of the chosen reading font. */
  fontFamily: string
  isLastPage: boolean
}

/** The text (and images) of one page, set for comfortable reading. */
export function ReaderPageView({
  paragraphs,
  images,
  imageUrls,
  fontSize,
  fontFamily,
  isLastPage,
}: ReaderPageViewProps) {
  const { t } = useTranslation()

  return (
    // Width in `em` of the reading text, so lines stay ~65 characters (the usual 50–75 range)
    // at every font size. Measured: Literata ≈ 63, Geist ≈ 66, Atkinson ≈ 67 per line.
    // (`ch` was uneven: Literata's wide "0" made its lines much shorter than the sans fonts'.)
    <article className="mx-auto flex w-full max-w-[31em] flex-col" style={{ fontSize: `${fontSize}px`, fontFamily }}>
      <div className="flex flex-col gap-[1em] leading-[1.65] text-pretty">
        {pageBlocks(paragraphs, images).map((block, index) =>
          block.type === 'text' ? (
            <p key={index}>{block.text}</p>
          ) : (
            <BookImage
              key={index}
              url={imageUrls?.get(block.image.path) ?? null}
              alt={block.image.alt}
              width={block.image.width || undefined}
              height={block.image.height || undefined}
            />
          ),
        )}
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

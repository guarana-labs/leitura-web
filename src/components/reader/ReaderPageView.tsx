import { memo, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import type { Token } from '@/lib/language'
import { cn } from '@/lib/utils'
import type { UserWord, WordStatus } from '@/types/vocabulary'

/** Background per status. Learned and ignored words are plain text. */
const STATUS_CLASSES: Record<WordStatus, string> = {
  new: 'bg-sky-500/15 dark:bg-sky-400/20',
  familiar: 'bg-amber-400/30 dark:bg-amber-300/25',
  learned: '',
  ignored: '',
}

export interface ClickedWord {
  /** The word as written on the page ("Sagte"). */
  text: string
  /** The key it is tracked under ("sagte"). */
  key: string
  element: HTMLElement
}

interface ReaderPageViewProps {
  /** Each paragraph already split into words and gaps. */
  paragraphs: Token[][]
  normalize: (word: string) => string
  /** The user's marks for this page; undefined while loading (no colors shown yet). */
  userWords: Map<string, UserWord> | undefined
  selectedKey: string | null
  onWordClick: (word: ClickedWord) => void
  fontSize: number
  /** CSS font-family of the chosen reading font. */
  fontFamily: string
  isLastPage: boolean
}

/** The text of one page, with every word clickable and colored by its status. */
export function ReaderPageView({
  paragraphs,
  normalize,
  userWords,
  selectedKey,
  onWordClick,
  fontSize,
  fontFamily,
  isLastPage,
}: ReaderPageViewProps) {
  const { t } = useTranslation()

  // One click handler for the whole page instead of one per word.
  function handleClick(event: MouseEvent<HTMLElement>) {
    const element = (event.target as HTMLElement).closest<HTMLElement>('[data-word]')
    if (!element) return
    const text = element.dataset.word ?? ''
    onWordClick({ text, key: normalize(text), element })
  }

  return (
    // Width in `em` of the reading text, so lines stay ~65 characters (the usual 50–75 range)
    // at every font size. Measured: Literata ≈ 63, Geist ≈ 66, Atkinson ≈ 67 per line.
    // (`ch` was uneven: Literata's wide "0" made its lines much shorter than the sans fonts'.)
    <article
      className="mx-auto flex w-full max-w-[31em] flex-col"
      style={{ fontSize: `${fontSize}px`, fontFamily }}
      onClick={handleClick}
    >
      <div className="flex flex-col gap-[1em] leading-[1.65] text-pretty">
        {paragraphs.map((tokens, index) => (
          <Paragraph
            key={index}
            tokens={tokens}
            normalize={normalize}
            userWords={userWords}
            selectedKey={selectedKey}
          />
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

interface ParagraphProps {
  tokens: Token[]
  normalize: (word: string) => string
  userWords: Map<string, UserWord> | undefined
  selectedKey: string | null
}

const Paragraph = memo(function Paragraph({ tokens, normalize, userWords, selectedKey }: ParagraphProps) {
  return (
    <p>
      {tokens.map((token, index) => {
        if (!token.isWord) return token.text
        const key = normalize(token.text)
        const status = userWords ? (userWords.get(key)?.status ?? 'new') : null
        return (
          <span
            key={index}
            data-word={token.text}
            className={cn(
              'cursor-pointer rounded-[3px] transition-colors hover:bg-muted',
              status && STATUS_CLASSES[status],
              key === selectedKey && 'ring-2 ring-ring/70',
            )}
          >
            {token.text}
          </span>
        )
      })}
    </p>
  )
})

export function ReaderPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[42rem] flex-col gap-3" aria-hidden>
      {Array.from({ length: 12 }, (_, index) => (
        <Skeleton key={index} className="h-4" style={{ width: `${index % 4 === 3 ? 60 : 100}%` }} />
      ))}
    </div>
  )
}

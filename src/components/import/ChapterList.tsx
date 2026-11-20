import { ArrowUpToLine, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format'

export interface ChapterListItem {
  key: string
  /** First words of the chapter, so the user can recognize it. */
  excerpt: string
  wordCount: number
  pageCount: number
}

interface ChapterListProps {
  chapters: ChapterListItem[]
  selectedIndex: number
  onSelect: (index: number) => void
  onMergeWithPrevious: (index: number) => void
  onRemove: (index: number) => void
}

/** Detected chapters: merge a wrongly detected chapter into the previous one, or remove it. */
export function ChapterList({ chapters, selectedIndex, onSelect, onMergeWithPrevious, onRemove }: ChapterListProps) {
  const { t } = useTranslation()

  return (
    <ol className="divide-y overflow-hidden rounded-lg border">
      {chapters.map((chapter, index) => {
        const label = t('chapter.label', { number: index + 1 })
        return (
          <li key={chapter.key} className={cn('flex items-center gap-2 pr-2', index === selectedIndex && 'bg-muted/50')}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === selectedIndex}
              className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
            >
              <span className="w-24 shrink-0 text-sm font-medium">{label}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{chapter.excerpt}</span>
              <span className="hidden shrink-0 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums sm:block">
                {t('import.chapters.size', { words: formatNumber(chapter.wordCount), count: chapter.pageCount })}
              </span>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={index === 0}
              onClick={() => onMergeWithPrevious(index)}
              aria-label={t('import.chapters.merge', { chapter: label })}
              title={t('import.chapters.merge', { chapter: label })}
            >
              <ArrowUpToLine aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              disabled={chapters.length === 1}
              onClick={() => onRemove(index)}
              aria-label={t('import.chapters.remove', { chapter: label })}
              title={t('import.chapters.remove', { chapter: label })}
            >
              <Trash2 aria-hidden />
            </Button>
          </li>
        )
      })}
    </ol>
  )
}

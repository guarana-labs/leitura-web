import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookCoverProps {
  title: string
  url: string | null
  className?: string
}

/** Book cover at a fixed 2:3 ratio, with a neutral placeholder when there is no image. */
export function BookCover({ title, url, className }: BookCoverProps) {
  return (
    <div className={cn('relative aspect-[2/3] shrink-0 overflow-hidden rounded-sm border bg-muted', className)}>
      {url ? (
        <img src={url} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-background">
          <BookOpen className="size-1/3 text-muted-foreground/60" aria-hidden />
        </div>
      )}
      <span className="sr-only">{title}</span>
    </div>
  )
}

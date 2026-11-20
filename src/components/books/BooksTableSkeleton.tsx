import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder rows shown while the library loads. */
export function BooksTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border" aria-hidden>
      <div className="h-10 border-b bg-muted/30" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
          <Skeleton className="aspect-[2/3] w-10" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-1.5 w-40" />
        </div>
      ))}
    </div>
  )
}

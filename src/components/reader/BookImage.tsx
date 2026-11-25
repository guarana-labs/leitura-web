import { cn } from '@/lib/utils'

interface BookImageProps {
  /** Null while the image's address is still loading. */
  url: string | null
  alt: string
  width?: number
  height?: number
  className?: string
}

/**
 * An image from a book, shown at its own size (never stretched): small ornaments
 * stay small, big photos shrink to fit the text column and never fill the whole screen.
 * Slightly dimmed in the Noite theme, so a bright photo doesn't dazzle at night.
 */
export function BookImage({ url, alt, width, height, className }: BookImageProps) {
  // Reserves the image's space before it loads, so the text doesn't jump.
  const aspectRatio = width && height ? `${width} / ${height}` : undefined

  return (
    <figure className={cn('my-1 flex justify-center', className)}>
      {url ? (
        // Not lazy-loaded: a page has few images, and lazy images without a size yet may never load.
        <img
          src={url}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          className="h-auto max-h-[70svh] max-w-full object-contain [.reader-night_&]:brightness-[.85]"
          // With a known size, the image's box exists before it loads (no jump, never 0×0).
          style={{ aspectRatio, width: width ? `${width}px` : 'auto' }}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="max-h-[70svh] max-w-full rounded bg-muted"
          style={{ width: width ?? '100%', aspectRatio: aspectRatio ?? '3 / 2' }}
        />
      )}
    </figure>
  )
}

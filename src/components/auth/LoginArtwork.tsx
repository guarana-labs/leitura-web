import { useTranslation } from 'react-i18next'
import type { LoginImage } from '@/lib/loginImages'
import { readerFontFamily } from '@/lib/readerFonts'
import { cn } from '@/lib/utils'

interface LoginArtworkProps {
  image: LoginImage
  className?: string
}

/** The login photo, cropped to fill its box around the image's focal point. */
export function LoginArtwork({ image, className }: LoginArtworkProps) {
  return (
    <div className={cn('relative overflow-hidden bg-black', className)}>
      {/* Absolute, so a tall photo fills its box without stretching the page. */}
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes="(min-width: 1024px) 60vw, 100vw"
        alt={image.alt}
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: image.focalPoint ?? 'center' }}
      />
    </div>
  )
}

/**
 * The photo's quote (or the default reading quote), in the reading font, and its credit.
 * White over the photo on phones; theme colours on the desktop form column.
 */
export function LoginFooter({ image, className }: LoginArtworkProps) {
  const { t } = useTranslation()
  const quote = image.quote ?? { text: t('auth.defaultQuote.text'), author: t('auth.defaultQuote.author') }

  return (
    <footer className={cn('flex flex-col gap-4', className)}>
      <figure>
        <blockquote
          className="text-[15px] leading-relaxed text-white/80 italic lg:text-muted-foreground"
          style={{ fontFamily: readerFontFamily('serif') }}
        >
          “{quote.text}”
        </blockquote>
        <figcaption className="mt-1 text-xs text-white/60 lg:text-muted-foreground/80">— {quote.author}</figcaption>
      </figure>
      <p className="text-[11px] leading-snug text-white/45 lg:text-muted-foreground/60">
        {image.credit.url ? (
          <a
            href={image.credit.url}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-current/30 underline-offset-2 transition-colors hover:text-white/80 lg:hover:text-foreground"
          >
            {image.credit.text}
          </a>
        ) : (
          image.credit.text
        )}
      </p>
    </footer>
  )
}

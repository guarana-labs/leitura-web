import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { readerFontFamily } from '@/lib/readerFonts'

const NASA_URL = 'https://images.nasa.gov/details/PIA21647'

/**
 * Jupiter photo for the login page (NASA/JPL-Caltech/SwRI/MSSS, PIA21647, public domain).
 * Nothing is drawn over it on desktop: the photo is the point.
 */
export function LoginArtwork({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <div className={cn('relative overflow-hidden bg-black', className)}>
      {/* Absolute, so the tall photo fills its box without stretching the page. */}
      <img
        src="/images/jupiter-1722.jpg"
        srcSet="/images/jupiter-860.jpg 860w, /images/jupiter-1722.jpg 1722w"
        sizes="(min-width: 1024px) 60vw, 100vw"
        alt={t('auth.artwork.alt')}
        className="absolute inset-0 size-full object-cover object-[0%_12%]"
      />
    </div>
  )
}

/**
 * Sagan quote (in the reading font, a nod to what the app is for) and the photo credit.
 * White over the photo on phones; theme colours on the desktop form column.
 */
export function LoginFooter({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <footer className={cn('flex flex-col gap-4', className)}>
      <figure>
        <blockquote
          className="text-[15px] leading-relaxed text-white/80 italic lg:text-muted-foreground"
          style={{ fontFamily: readerFontFamily('serif') }}
        >
          {t('auth.artwork.quote')}
        </blockquote>
        <figcaption className="mt-1 text-xs text-white/60 lg:text-muted-foreground/80">— Carl Sagan</figcaption>
      </figure>
      <p className="text-[11px] leading-snug text-white/45 lg:text-muted-foreground/60">
        <a
          href={NASA_URL}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-current/30 underline-offset-2 transition-colors hover:text-white/80 lg:hover:text-foreground"
        >
          {t('auth.artwork.credit')}
        </a>
      </p>
    </footer>
  )
}

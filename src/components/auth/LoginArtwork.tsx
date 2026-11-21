import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const NASA_URL = 'https://images.nasa.gov/details/PIA21647'

/**
 * Jupiter photo for the login page (NASA/JPL-Caltech/SwRI/MSSS, PIA21647, public domain).
 * The image is the point of the panel; the quote and credit stay quiet.
 */
export function LoginArtwork({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <div className={cn('relative overflow-hidden bg-black', className)}>
      {/* Absolute, so the tall photo fills its box without stretching the page. */}
      <img
        src="/images/jupiter-1722.jpg"
        srcSet="/images/jupiter-860.jpg 860w, /images/jupiter-1722.jpg 1722w"
        sizes="(min-width: 1024px) 50vw, 100vw"
        alt={t('auth.artwork.alt')}
        className="absolute inset-0 size-full object-cover object-[0%_12%]"
      />
    </div>
  )
}

/** Sagan quote and NASA credit, set small and translucent over the photo. */
export function LoginArtworkCaption({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <figure className={cn('max-w-sm text-white', className)}>
      <blockquote className="text-sm leading-relaxed text-white/70 italic">{t('auth.artwork.quote')}</blockquote>
      <figcaption className="mt-1.5 text-xs text-white/50">— Carl Sagan</figcaption>
      <p className="mt-4 text-[11px] leading-snug text-white/40">
        <a
          href={NASA_URL}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/70"
        >
          {t('auth.artwork.credit')}
        </a>
      </p>
    </figure>
  )
}

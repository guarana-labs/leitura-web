import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { INSTAGRAM_URL } from '@/lib/links'

const linkClass = 'transition-colors hover:text-foreground hover:underline underline-offset-4'

/**
 * One quiet line at the end of the app pages (library, book, import).
 * Not used by the reader or the login, which have their own minimal chrome.
 */
export function AppFooter() {
  const { t } = useTranslation()

  const items: ReactNode[] = [
    <span key="name">{t('app.name')}</span>,
    <Link key="privacy" to={paths.privacy} className={linkClass}>
      {t('footer.privacy')}
    </Link>,
    <a key="instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={linkClass}>
      Instagram
    </a>,
    <span key="version" className="font-mono" title={t('footer.versionLabel')}>
      v{__APP_VERSION__}
    </span>,
  ]

  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-6 text-xs text-muted-foreground/80">
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && <span aria-hidden>·</span>}
            {item}
          </Fragment>
        ))}
      </div>
    </footer>
  )
}

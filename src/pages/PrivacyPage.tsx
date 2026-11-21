import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/links'

interface PrivacySection {
  title: string
  paragraphs?: string[]
  items?: string[]
}

/**
 * Plain-language privacy page. Public (outside the route guards) so people can read it
 * before creating an account. The text lives in pt-BR.json under `privacy`.
 */
export function PrivacyPage() {
  const { t } = useTranslation()
  const { session } = useAuth()
  useDocumentTitle(t('privacy.title'))

  const sections = t('privacy.sections', { returnObjects: true }) as PrivacySection[]
  const back = session
    ? { to: paths.dashboard, label: t('privacy.backToLibrary') }
    : { to: paths.login, label: t('privacy.backToLogin') }

  return (
    <div className="mx-auto w-full max-w-prose px-5 py-10 sm:py-16">
      <Link
        to={back.to}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {back.label}
      </Link>

      <h1 className="mt-8 text-3xl font-semibold tracking-tight">{t('privacy.title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('privacy.updatedAt')}</p>
      <p className="mt-6 leading-7">{t('privacy.intro')}</p>

      {sections.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 leading-7 text-muted-foreground">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">{t('privacy.contact.title')}</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          {t('privacy.contact.text')}{' '}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-4"
          >
            {INSTAGRAM_HANDLE}
          </a>
          .
        </p>
      </section>
    </div>
  )
}

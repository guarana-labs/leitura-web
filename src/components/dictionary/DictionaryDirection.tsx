import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DictionaryInfo } from '@/lib/dictionary/dictionaries'

/** [dictionary branch only] "alemão › inglês": the languages a dictionary translates between. */
export function DictionaryDirection({ dictionary }: { dictionary: DictionaryInfo }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-0.5">
      {t(`dictionaries.languages.${dictionary.language}`)}
      <ChevronRight className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{t('dictionaries.to')}</span>
      {t(`dictionaries.languages.${dictionary.target}`)}
    </span>
  )
}

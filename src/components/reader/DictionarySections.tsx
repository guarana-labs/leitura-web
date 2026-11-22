import { useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DictionaryDirection } from '@/components/dictionary/DictionaryDirection'
import { DictionarySection } from '@/components/reader/DictionarySection'
import { Skeleton } from '@/components/ui/skeleton'
import { useChosenDictionary } from '@/hooks/useDictionaryChoices'
import { dictionaryEntriesQuery, useBaseWords } from '@/hooks/useVocabulary'
import type { LanguageProfile } from '@/lib/language'

interface DictionarySectionsProps {
  /** The clicked word as written on the page. */
  word: string
  profile: LanguageProfile
}

/**
 * [dictionary branch only] The chosen dictionary's senses for the clicked word,
 * followed by those of its base word(s) when it's an inflected form:
 *   "fängt" → senses of "fängt" (if any), then "Forma base: fangen".
 * Only the clicked word matters; the sentence around it isn't considered.
 */
export function DictionarySections({ word, profile }: DictionarySectionsProps) {
  const { t } = useTranslation()
  const { dictionary, isPending } = useChosenDictionary(profile.code)
  const key = profile.normalize(word)
  const baseWords = useBaseWords(profile.code, key)
  const bases = baseWords.data ?? []

  // Base words are listed for every German dictionary, so the chosen one may not
  // have some of them: only the ones it can translate get a section.
  const baseEntries = useQueries({
    queries: bases.map((base) => ({
      ...dictionaryEntriesQuery<unknown>(dictionary?.id ?? '', profile.normalize(base)),
      enabled: dictionary !== null,
    })),
  })
  const translatedBases = bases.filter((_, index) => (baseEntries[index]?.data?.length ?? 0) > 0)
  const basesLoading = baseWords.isPending || baseEntries.some((query) => query.isPending)

  if (isPending) {
    return (
      <div className="flex flex-col gap-1.5 border-t pt-3" aria-hidden>
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    )
  }

  if (!dictionary) {
    return <p className="border-t pt-3 text-xs text-muted-foreground">{t('vocabulary.noDictionary')}</p>
  }

  return (
    <>
      <DictionarySection
        dictionary={dictionary}
        word={word}
        wordKey={key}
        title={
          <>
            {t(`dictionaries.${dictionary.id}.name`)} (<DictionaryDirection dictionary={dictionary} />)
          </>
        }
        // While base words load, or when one of them has senses, an empty entry for
        // the clicked form is hidden: the base word's senses below are what matters.
        hideWhenEmpty={basesLoading || translatedBases.length > 0}
      />
      {translatedBases.map((base) => (
        <DictionarySection
          key={base}
          dictionary={dictionary}
          word={base}
          wordKey={profile.normalize(base)}
          title={t('vocabulary.dictionary.baseForm', { word: base })}
        />
      ))}
    </>
  )
}

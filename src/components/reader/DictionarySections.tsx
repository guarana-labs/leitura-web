import { useTranslation } from 'react-i18next'
import { DictccSection } from '@/components/reader/DictccSection'
import { useBaseWords } from '@/hooks/useVocabulary'
import type { LanguageProfile } from '@/lib/language'

interface DictionarySectionsProps {
  /** The clicked word as written on the page. */
  word: string
  profile: LanguageProfile
}

/**
 * [dictionary branch only] dict.cc translations of the clicked word, followed by
 * the translations of its base word(s) when it's an inflected form:
 *   "fängt" → dict.cc for "fängt" (if any), then "Forma base: fangen".
 * Only the clicked word matters; the sentence around it isn't considered.
 */
export function DictionarySections({ word, profile }: DictionarySectionsProps) {
  const { t } = useTranslation()
  const key = profile.normalize(word)
  const baseWords = useBaseWords(profile.code, key)
  const bases = baseWords.data ?? []

  return (
    <>
      <DictccSection
        word={word}
        wordKey={key}
        // While base words are loading, or when there are some, an empty exact
        // entry is hidden: the base word's translations below are what matters.
        hideWhenEmpty={baseWords.isPending || bases.length > 0}
      />
      {bases.map((base) => (
        <DictccSection
          key={base}
          word={base}
          wordKey={profile.normalize(base)}
          title={t('vocabulary.dictcc.baseForm', { word: base })}
        />
      ))}
    </>
  )
}

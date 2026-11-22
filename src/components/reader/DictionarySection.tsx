import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDictionaryEntries } from '@/hooks/useVocabulary'
import { rankDictccEntries, type DictccEntry } from '@/lib/dictionary/dictcc'
import type { DictionaryInfo } from '@/lib/dictionary/dictionaries'
import { rankWikdictEntries, type WikdictEntry } from '@/lib/dictionary/wikdict'

/** How many senses are shown before "show more". */
const VISIBLE_SENSES = 6

interface DictionarySectionProps {
  dictionary: DictionaryInfo
  /** The word as written (its capitalization matters for ranking). */
  word: string
  /** The lookup key (normalized word). */
  wordKey: string
  title: ReactNode
  /** Render nothing (instead of "no translation") when the dictionary has no entry. */
  hideWhenEmpty?: boolean
}

/** [dictionary branch only] One dictionary's senses for a word, most useful first. */
export function DictionarySection({ dictionary, word, wordKey, title, hideWhenEmpty = false }: DictionarySectionProps) {
  const { t } = useTranslation()
  const entries = useDictionaryEntries<DictccEntry | WikdictEntry>(dictionary.id, wordKey)
  const [showAll, setShowAll] = useState(false)

  const senses = useMemo(() => {
    const data = entries.data ?? []
    return dictionary.format === 'dictcc'
      ? rankDictccEntries(data as DictccEntry[], word).map(dictccSense)
      : rankWikdictEntries(data as WikdictEntry[], word).map(wikdictSense)
  }, [entries.data, dictionary.format, word])
  const visible = showAll ? senses : senses.slice(0, VISIBLE_SENSES)

  if (hideWhenEmpty && entries.isSuccess && senses.length === 0) return null

  return (
    <section className="flex flex-col gap-2 border-t pt-3">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>

      {entries.isPending ? (
        <div className="flex flex-col gap-1.5" aria-hidden>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
      ) : entries.isError ? (
        <p className="text-sm text-destructive">{t('vocabulary.dictionaryError')}</p>
      ) : senses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('vocabulary.noDefinition')}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2 text-sm">
            {visible.map((sense, index) => (
              <li key={index} className="flex flex-col">
                <span lang={sense.targetLang}>{sense.translation}</span>
                <span className="text-xs text-muted-foreground" lang={dictionary.language}>
                  {sense.source}
                  {sense.partOfSpeech && (
                    <span className="ml-1.5 italic">
                      ·{' '}
                      {sense.partOfSpeech.kind === 'code'
                        ? t(`vocabulary.partsOfSpeech.${sense.partOfSpeech.value}`)
                        : sense.partOfSpeech.value}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {senses.length > VISIBLE_SENSES && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto self-start p-0 text-xs"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll
                ? t('vocabulary.dictionary.showLess')
                : t('vocabulary.dictionary.showMore', { count: senses.length })}
            </Button>
          )}
        </>
      )}
    </section>
  )
}

/** A sense ready to show: the translation, the source-language line under it, and the word type. */
interface Sense {
  translation: string
  targetLang: string
  /** dict.cc: the German headword with its notes; WikDict: the explanation of the sense. */
  source: string
  /** dict.cc gives English names ("verb"); WikDict codes are translated. */
  partOfSpeech: { kind: 'text'; value: string } | { kind: 'code'; value: Exclude<WikdictEntry[1], ''> } | null
}

function dictccSense([german, english, type]: DictccEntry): Sense {
  return { translation: english, targetLang: 'en', source: german, partOfSpeech: type ? { kind: 'text', value: type } : null }
}

function wikdictSense([word, partOfSpeech, explanation, translations]: WikdictEntry): Sense {
  return {
    translation: translations.join(', '),
    targetLang: 'pt-BR',
    source: explanation || word,
    partOfSpeech: partOfSpeech ? { kind: 'code', value: partOfSpeech } : null,
  }
}

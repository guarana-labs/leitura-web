import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDictcc } from '@/hooks/useVocabulary'
import { rankDictccEntries } from '@/lib/dictionary/dictcc'

/** How many senses are shown before "show more". */
const VISIBLE_SENSES = 6

interface DictccSectionProps {
  /** The word as written on the page (its capitalization matters for ranking). */
  word: string
  /** The lookup key (normalized word). */
  wordKey: string
  /** Heading; defaults to "dict.cc (alemão → inglês)". */
  title?: string
  /** Render nothing (instead of "no translation") when dict.cc has no entry. */
  hideWhenEmpty?: boolean
}

/** [dictionary branch only] dict.cc translations for a word, most useful first. */
export function DictccSection({ word, wordKey, title, hideWhenEmpty = false }: DictccSectionProps) {
  const { t } = useTranslation()
  const dictcc = useDictcc(wordKey, true)
  const [showAll, setShowAll] = useState(false)

  const ranked = useMemo(() => rankDictccEntries(dictcc.data ?? [], word), [dictcc.data, word])
  const visible = showAll ? ranked : ranked.slice(0, VISIBLE_SENSES)

  if (hideWhenEmpty && dictcc.isSuccess && ranked.length === 0) return null

  return (
    <section className="flex flex-col gap-2 border-t pt-3">
      <h3 className="text-xs font-medium text-muted-foreground">{title ?? t('vocabulary.dictcc.title')}</h3>

      {dictcc.isPending ? (
        <div className="flex flex-col gap-1.5" aria-hidden>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
      ) : dictcc.isError ? (
        <p className="text-sm text-destructive">{t('vocabulary.dictionaryError')}</p>
      ) : ranked.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('vocabulary.noDefinition')}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2 text-sm">
            {visible.map(([german, english, type], index) => (
              <li key={index} className="flex flex-col">
                <span lang="en">{english}</span>
                <span className="text-xs text-muted-foreground" lang="de">
                  {german}
                  {type && <span className="ml-1.5 italic">· {type}</span>}
                </span>
              </li>
            ))}
          </ul>
          {ranked.length > VISIBLE_SENSES && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto self-start p-0 text-xs"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? t('vocabulary.dictcc.showLess') : t('vocabulary.dictcc.showMore', { count: ranked.length })}
            </Button>
          )}
        </>
      )}
    </section>
  )
}

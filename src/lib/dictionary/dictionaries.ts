/**
 * [dictionary branch only] The dictionaries hosted on the server, by book language.
 * The user picks one per language on the Settings page; the word box shows only that one.
 */
import { DICTCC_DE_EN } from '@/lib/dictionary/dictcc'
import { WIKDICT_DE_PT, WIKDICT_EN_PT } from '@/lib/dictionary/wikdict'

export const DICTIONARY_IDS = [DICTCC_DE_EN, WIKDICT_DE_PT, WIKDICT_EN_PT] as const
export type DictionaryId = (typeof DICTIONARY_IDS)[number]

/** How a dictionary's entries are stored (and therefore shown). */
export type DictionaryFormat = 'dictcc' | 'wikdict'

/** Languages dictionaries translate from or to (their names are UI translations). */
export type DictionaryLanguage = 'de' | 'en' | 'pt-BR'

export interface DictionaryInfo {
  id: DictionaryId
  /** Book language it translates from (a language profile code). */
  language: DictionaryLanguage
  /** Language of the translations. */
  target: DictionaryLanguage
  format: DictionaryFormat
}

/** Per language, the first one is the default. */
export const DICTIONARIES: readonly DictionaryInfo[] = [
  { id: DICTCC_DE_EN, language: 'de', target: 'en', format: 'dictcc' },
  { id: WIKDICT_DE_PT, language: 'de', target: 'pt-BR', format: 'wikdict' },
  { id: WIKDICT_EN_PT, language: 'en', target: 'pt-BR', format: 'wikdict' },
]

/** Book languages that have at least one dictionary, in the order they're listed. */
export const DICTIONARY_LANGUAGES = [...new Set(DICTIONARIES.map((dictionary) => dictionary.language))]

export function dictionariesFor(language: string): DictionaryInfo[] {
  return DICTIONARIES.filter((dictionary) => dictionary.language === language)
}

/** The user's choice for a language if it's still available, otherwise the default; null if none. */
export function resolveDictionary(language: string, chosen: string | undefined): DictionaryInfo | null {
  const available = dictionariesFor(language)
  return available.find((dictionary) => dictionary.id === chosen) ?? available[0] ?? null
}

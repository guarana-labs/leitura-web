/**
 * Languages a book can be in. Stored in `books.language` as the code.
 *
 * Each language is shown by its own name ("Deutsch", not "Alemão") next to a flag,
 * so the list reads the same whatever the UI language is.
 * Flags come from flag-icons (MIT), see public/flags/LICENSE.txt.
 */
export const BOOK_LANGUAGES = [
  { code: 'pt-BR', nativeName: 'Brasileiro', flag: '/flags/br.svg' },
  { code: 'en', nativeName: 'English', flag: '/flags/gb.svg' },
  { code: 'de', nativeName: 'Deutsch', flag: '/flags/de.svg' },
] as const

/** Any language not in the list. Its label is a UI translation ("Outros", "Others", ...). */
export const OTHER_LANGUAGE = 'other'

export type BookLanguage = (typeof BOOK_LANGUAGES)[number]['code'] | typeof OTHER_LANGUAGE

export const DEFAULT_BOOK_LANGUAGE: BookLanguage = 'en'

/** Brazilian books were stored as "pt" before the code became "pt-BR". */
const LEGACY_CODES: Record<string, BookLanguage> = { pt: 'pt-BR' }

function findLanguage(code: string) {
  const resolved = LEGACY_CODES[code] ?? code
  return BOOK_LANGUAGES.find((language) => language.code === resolved)
}

/** Maps a stored value to a picker option: unknown values become "other", missing ones the default. */
export function toBookLanguage(stored: string | null): BookLanguage {
  if (stored === null || stored === '') return DEFAULT_BOOK_LANGUAGE
  return findLanguage(stored)?.code ?? OTHER_LANGUAGE
}

/** Maps a language tag from a file ("pt", "pt-BR", "de-DE", "fr") to a picker option. */
export function languageFromTag(tag: string | null): BookLanguage {
  if (!tag) return DEFAULT_BOOK_LANGUAGE
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0]
  // Any "pt" tag ("pt", "pt-BR", "pt-PT") counts as Brazilian.
  if (primary === 'pt') return 'pt-BR'
  return findLanguage(primary)?.code ?? OTHER_LANGUAGE
}

/** Native name for a stored language code, or null for "other" / unknown codes. */
export function nativeLanguageName(code: string): string | null {
  return findLanguage(code)?.nativeName ?? null
}

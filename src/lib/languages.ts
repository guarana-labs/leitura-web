/**
 * Languages a book can be in. Stored in `books.language` as the code.
 *
 * Each language is shown by its own name ("Deutsch", not "Alemão"), which never
 * changes with the UI language. The name in the UI language is shown next to it
 * as a hint, computed by the browser (Intl.DisplayNames), so it adapts for free
 * when more UI languages are added.
 */
export const BOOK_LANGUAGES = [
  { code: 'pt', nativeName: 'Português' },
  { code: 'en', nativeName: 'English' },
  { code: 'de', nativeName: 'Deutsch' },
] as const

/** Any language not in the list. Its label is a UI translation ("Outros", "Others", ...). */
export const OTHER_LANGUAGE = 'other'

export type BookLanguage = (typeof BOOK_LANGUAGES)[number]['code'] | typeof OTHER_LANGUAGE

export const DEFAULT_BOOK_LANGUAGE: BookLanguage = 'en'

/**
 * The language's name in the UI language, e.g. "Alemão" for "de" in pt-BR.
 * Returns null when it would just repeat the native name (e.g. "Português" in pt-BR).
 */
export function translatedLanguageName(code: string, uiLocale: string): string | null {
  const native = BOOK_LANGUAGES.find((language) => language.code === code)?.nativeName
  try {
    const name = new Intl.DisplayNames([uiLocale], { type: 'language' }).of(code)
    if (!name || name === code) return null
    const capitalized = name.charAt(0).toLocaleUpperCase(uiLocale) + name.slice(1)
    return capitalized.toLocaleLowerCase(uiLocale) === native?.toLocaleLowerCase(uiLocale) ? null : capitalized
  } catch {
    return null
  }
}

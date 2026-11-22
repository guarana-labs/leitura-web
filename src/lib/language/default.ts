import type { LanguageProfile, Token } from '@/lib/language/types'

/**
 * A word: letters (any script, with accents), optionally joined by an inner
 * apostrophe or hyphen — so "don't", "well-known" and "guarda-chuva" stay whole.
 */
const WORD = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu

export function tokenizeWords(text: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const match of text.matchAll(WORD)) {
    const start = match.index ?? 0
    if (start > last) tokens.push({ text: text.slice(last, start), isWord: false })
    tokens.push({ text: match[0], isWord: true })
    last = start + match[0].length
  }
  if (last < text.length) tokens.push({ text: text.slice(last), isWord: false })
  return tokens
}

export function normalizeWord(word: string, locale: string): string {
  return word
    .normalize('NFC')
    .replace(/’/g, "'")
    .toLocaleLowerCase(locale === 'other' ? undefined : locale)
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

/** Builds a profile with the default rules; languages override only what differs. */
export function createProfile(code: string, overrides: Partial<Omit<LanguageProfile, 'code'>> = {}): LanguageProfile {
  return {
    code,
    tokenize: tokenizeWords,
    normalize: (word) => normalizeWord(word, code),
    // Dictionaries list most words in lowercase; try that first, then the text as written.
    dictionaryQueries: (word) => unique([normalizeWord(word, code), word.normalize('NFC')]),
    ...overrides,
  }
}

export const defaultProfile = createProfile('other')

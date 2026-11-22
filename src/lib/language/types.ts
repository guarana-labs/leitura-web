/** A piece of text: either a word (clickable, tracked) or the gap between words. */
export interface Token {
  text: string
  isWord: boolean
}

/**
 * Language-specific rules. Most languages use the default profile; a language
 * only overrides what differs (see de.ts, pt.ts).
 */
export interface LanguageProfile {
  /** Code stored on books and words ("de", "pt", "en", "other"). */
  code: string
  /** Splits text into words and the gaps between them, keeping every character. */
  tokenize(text: string): Token[]
  /** The key a word is stored under: lowercase, cleaned (so "Sagte," and "sagte" match). */
  normalize(word: string): string
  /** Spellings to look up in the dictionary, in order of preference. */
  dictionaryQueries(word: string): string[]
}

import { createProfile, normalizeWord } from '@/lib/language/default'

/**
 * German: capitalization carries meaning ("Essen" the noun vs "essen" the verb),
 * so the dictionary is asked for the exact spelling first, then lowercase.
 *
 * Word status still uses the lowercase key, because every sentence starts with
 * a capital letter: "Die" and "die" must be the same word for tracking.
 */
export const germanProfile = createProfile('de', {
  dictionaryQueries: (word) => [...new Set([word.normalize('NFC'), normalizeWord(word, 'de')])],
})

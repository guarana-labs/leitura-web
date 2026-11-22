/**
 * [dictionary branch only] WikDict data (https://www.wikdict.com, built from
 * Wiktionary, CC BY-SA). Shared by the import script (scripts/import-wikdict.ts)
 * and the app.
 *
 * A WikDict file has one row per sense: the headword, its Wiktionary entry
 * ("deu/fangen__Verb__1"), a short explanation in the source language and the
 * translations ("pegar | capturar"), plus a quality score.
 */

export const WIKDICT_DE_PT = 'wikdict-de-pt'
export const WIKDICT_EN_PT = 'wikdict-en-pt'

/** Parts of speech shown in the word box (WikDict's German and English names are mapped to these). */
export const PARTS_OF_SPEECH = [
  'noun',
  'properNoun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'article',
  'preposition',
  'conjunction',
  'interjection',
  'numeral',
  'particle',
  'phrase',
] as const
export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number]

/**
 * One sense: [headword, part of speech, explanation, translations].
 *   ["fangen", "verb", "einen zugeworfenen Gegenstand fassen und festhalten", ["pegar", "capturar"]]
 * Part of speech and explanation may be "" when WikDict doesn't have them.
 */
export type WikdictEntry = [word: string, partOfSpeech: PartOfSpeech | '', explanation: string, translations: string[]]

const PART_OF_SPEECH_NAMES: Record<string, PartOfSpeech> = {
  Noun: 'noun',
  Substantiv: 'noun',
  Proper_noun: 'properNoun',
  Eigenname: 'properNoun',
  Toponym: 'properNoun',
  Verb: 'verb',
  Adjective: 'adjective',
  Adjektiv: 'adjective',
  Adverb: 'adverb',
  Pronoun: 'pronoun',
  Article: 'article',
  Artikel: 'article',
  Determiner: 'article',
  Preposition: 'preposition',
  Präposition: 'preposition',
  Postposition: 'preposition',
  Zirkumposition: 'preposition',
  Conjunction: 'conjunction',
  Konjunktion: 'conjunction',
  Subjunktion: 'conjunction',
  Interjection: 'interjection',
  Interjektion: 'interjection',
  Numeral: 'numeral',
  Number: 'numeral',
  Numerale: 'numeral',
  Particle: 'particle',
  Phrase: 'phrase',
  Prepositional_phrase: 'phrase',
  Proverb: 'phrase',
  Redewendung: 'phrase',
  Wortverbindung: 'phrase',
  Sprichwort: 'phrase',
  Geflügeltes_Wort: 'phrase',
  Formel: 'phrase',
  Grußformel: 'phrase',
}

/**
 * The part of speech of a Wiktionary entry id: "deu/fangen__Verb__1" → "verb".
 * German has many specific kinds ("Personalpronomen", "Lokaladverb"…), matched by their ending.
 */
export function partOfSpeechOf(lexentry: string | null): PartOfSpeech | '' {
  const name = lexentry?.match(/__(.+?)__\d+$/)?.[1]
  if (!name) return ''
  if (PART_OF_SPEECH_NAMES[name]) return PART_OF_SPEECH_NAMES[name]
  if (/pronomen$/i.test(name)) return 'pronoun'
  if (/adverb$/i.test(name)) return 'adverb'
  if (/partikel$/i.test(name)) return 'particle'
  return ''
}

/**
 * Senses in the most useful order for the clicked word: the exact spelling first
 * ("Essen" the noun vs "essen" the verb), then the stored order (WikDict's score,
 * highest first). The sort is stable.
 */
export function rankWikdictEntries(entries: WikdictEntry[], clicked: string): WikdictEntry[] {
  return [...entries].sort((a, b) => Number(b[0] === clicked) - Number(a[0] === clicked))
}

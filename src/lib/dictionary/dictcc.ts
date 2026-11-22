/**
 * dict.cc German→English data: how a line is read, how a headword becomes a
 * lookup key, and how a word's senses are ranked. Shared by the import script
 * (scripts/import-dictcc.ts) and the app, so both always agree.
 *
 * A dict.cc line has 4 tab-separated columns:
 *   German (with notes)  ⇥  English (with notes)  ⇥  word type  ⇥  subject tags
 *   e.g. "Haus {n} [einer Schnecke]  ⇥  shell [of a snail]  ⇥  noun  ⇥  [zool.]"
 *
 * Notes in the German column: {f}/{m}/{n} gender, [ugs.] usage, [Akk.] grammar,
 * <Abk.> abbreviation, (…) optional part, and placeholders like "etw." / "jdm.".
 * The main sense of a verb is usually written with placeholders:
 * "(jdm.) etw. [Akk.] sagen" = "to say sth. (to sb.)".
 */

export const DICTCC_DE_EN = 'dictcc-de-en'

/** One sense: [german, english, wordType, subjectTags]. */
export type DictccEntry = [german: string, english: string, type: string, tags: string]

/** Placeholders in verb entries: "jdm. etw. sagen" → "sagen", also joined: "jdn./etw. fangen". */
const PLACEHOLDERS = /\b(?:etw|jdm|jdn|jds|jd|sb|sth)\.(?=[\s/]|$)|\bsich\b/g

/** A "/" left alone once the placeholders around it are gone ("jdn./etw." → "/"). */
const LONE_SLASHES = /(?:^|\s)\/+(?=\s|$)/g

/** Annotations in the German column: {gender}, [notes], <abbreviations>, (optional parts). */
const ANNOTATIONS = /\{[^}]*\}|\[[^\]]*\]|<[^>]*>|\([^)]*\)/g

/** dict.cc writes some characters as HTML codes, e.g. "&#945;" = "α". */
export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** The headword without annotations or placeholders, keeping its capitalization ("Essen {n}" → "Essen"). */
export function cleanHeadword(german: string): string {
  return german
    .replace(ANNOTATIONS, ' ')
    .replace(PLACEHOLDERS, ' ')
    .replace(LONE_SLASHES, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The lookup key for a headword: clean, lowercase, curly apostrophes made straight.
 * Matches the German language profile's `normalize`, so a clicked word finds its row.
 */
export function dictccKey(german: string): string {
  return cleanHeadword(german).normalize('NFC').replace(/’/g, "'").toLocaleLowerCase('de')
}

/** Reads one line of the dict.cc file; null for comments, blank or malformed lines. */
export function parseDictccLine(line: string): DictccEntry | null {
  if (!line || line.startsWith('#')) return null
  const columns = line.split('\t')
  const german = decodeEntities((columns[0] ?? '').trim())
  const english = decodeEntities((columns[1] ?? '').trim())
  if (!german || !english) return null
  return [german, english, (columns[2] ?? '').trim(), (columns[3] ?? '').trim()]
}

/**
 * Usage notes that mark a sense as less common: slang, old, regional, rare,
 * humorous, titles of works… They may open a longer note: "[obs. or Scot.]", "[esp. Br.]".
 * The marker must end with "." or "]", so "[Am Telefon]" is not "[Am.]".
 */
const MARKED =
  /\[(?:esp\. )?(?:coll|sl|slang|archaic|obs|dated|dial|regional|rare|poet|hum|pej|vulg|ugs|veraltet|veraltend|selten|südd|österr|schweiz|Jugendsprache|derb|hist|lit|F|Br|Am|Aus|Scot|Irish|N\. Engl)(?:\.|\])/i

/** The English words alone: "to say sth. (to sb.)" → "to say". */
function plainEnglish(english: string): string {
  return english
    .replace(/\[[^\]]*\]|\([^)]*\)|<[^>]*>|\{[^}]*\}/g, ' ')
    .replace(/\b(?:sb|sth)\.(?=[\s/]|$)|\bone's\b/g, ' ')
    .replace(/(?:^|\s)\/+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Words that say nothing about how common a translation is. */
const FILLER_WORDS = new Set(['to', 'be', 'a', 'an', 'the', 'of', 'oneself'])

/** The meaningful English words of a sense: "to be aware of" → ["aware"]. */
export function englishWords(english: string): string[] {
  return (plainEnglish(english).toLowerCase().match(/[a-z']+/g) ?? []).filter((word) => !FILLER_WORDS.has(word))
}

/**
 * Orders a word's senses from the plainest, most common English to the rarest.
 * Done once at import; the ranking below keeps this order among equal scores.
 *   1. Fewer words first: "to catch" before "to round up".
 *   2. More common words first, using how often each English word appears in the
 *      whole dict.cc file (`counts`): "to catch" (478) before "to trap" (304) before
 *      "to cop" (85). A sense is as common as its rarest word.
 *   3. Shorter text first.
 */
export function sortByCommonness(entries: DictccEntry[], counts: Map<string, number>): DictccEntry[] {
  return entries
    .map((entry) => {
      const words = englishWords(entry[1])
      const common = words.length === 0 ? 0 : Math.min(...words.map((word) => counts.get(word) ?? 0))
      return { entry, words: words.length || Infinity, common, length: plainEnglish(entry[1]).length }
    })
    .sort((a, b) => a.words - b.words || b.common - a.common || a.length - b.length)
    .map(({ entry }) => entry)
}

/** Grammar notes ("[Akk.]", "[+Dat.]") say how a word is used, not which meaning it is. */
const GRAMMAR_NOTE = /^\[\+?\s*(?:Akk|Dat|Gen|Nom)\.?\]$/i

/** A note (not grammar, not usage) that narrows the sense: "sitzen [Kleidung]", "caregiver [doctor]". */
function hasNote(text: string): boolean {
  return (text.match(/\[[^\]]*\]/g) ?? []).some((note) => !GRAMMAR_NOTE.test(note) && !MARKED.test(note))
}

/**
 * Rules that move a sense up or down; equal scores keep the stored order
 * (plainest, most common English first). Subject tags like "[fin.]" are not
 * used: main senses often have one too ("bank [fin.]", "eye [anat.]").
 */
function score([german, english, type]: DictccEntry, clicked: string): number {
  const clean = cleanHeadword(german)
  let value = 0
  // Spelling as clicked first: "Essen" (food) and "essen" (to eat) are different words.
  // A small bonus, since a capital letter may just start the sentence ("Die …").
  if (clean === clicked) value += 3
  else if (clean.toLocaleLowerCase('de') === clicked.toLocaleLowerCase('de')) value += 2
  if (MARKED.test(german) || MARKED.test(english)) value -= 3
  if (hasNote(german)) value -= 1
  if (hasNote(english)) value -= 1
  if (!type) value -= 1 // untyped entries are often phrases or titles
  if (/\bsich\b/.test(german)) value -= 1 // reflexive variant ("sich etw. sagen")
  // A capitalized English word identical to the German is a name: "Auge" (Greek myth).
  if (english === clean && /^\p{Lu}/u.test(english)) value -= 1
  return value
}

/**
 * Most useful senses first for the clicked word (as written on the page).
 * The sort is stable, so equal scores keep the stored order: most common English first.
 */
export function rankDictccEntries(entries: DictccEntry[], clicked: string): DictccEntry[] {
  return [...entries]
    .filter(([, english]) => english.replace(/\[[^\]]*\]/g, '').trim() !== '')
    .sort((a, b) => score(b, clicked) - score(a, clicked))
}

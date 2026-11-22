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
 * humorous, titles of works… Grammar marks like [Akk.] or [Dat.] are not usage notes.
 */
const MARKED =
  /\[(?:coll|sl|slang|archaic|obs|dated|dial|regional|rare|poet|hum|pej|vulg|ugs|veraltet|selten|südd|österr|schweiz|Jugendsprache|derb|hist|lit|F|Br|Am|Aus|Scot|Irish)\.?\]/i

function score([german, english, type, tags]: DictccEntry, clicked: string): number {
  const clean = cleanHeadword(german)
  let value = 0
  // Exact spelling first: in German "Essen" (food) and "essen" (to eat) are different words.
  if (clean === clicked) value += 8
  else if (clean.toLocaleLowerCase('de') === clicked.toLocaleLowerCase('de')) value += 4
  if (MARKED.test(german) || MARKED.test(english)) value -= 3
  if (tags) value -= 1 // specialized subject (biology, law…)
  if (!type) value -= 1 // untyped entries are often phrases or titles
  if (/\bsich\b/.test(german)) value -= 1 // reflexive variant ("sich etw. sagen")
  return value * 1000 - english.length
}

/** Most useful senses first for the clicked word (as written on the page). */
export function rankDictccEntries(entries: DictccEntry[], clicked: string): DictccEntry[] {
  return [...entries]
    .filter(([, english]) => english.replace(/\[[^\]]*\]/g, '').trim() !== '')
    .sort((a, b) => score(b, clicked) - score(a, clicked))
}

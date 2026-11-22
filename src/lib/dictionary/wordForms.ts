/**
 * Base words for inflected forms ("fängt" → fangen). Pure functions used by the
 * import script (scripts/import-word-forms.ts); kept here so they can be tested.
 *
 * The source data (based on LanguageTool's German dictionary) lists a verb
 * table per base word and a declension table per noun:
 *   verbs.json: { fangen: { PRÄ: { S: { 3: "fängt" … } … }, PRT: …, PA2: ["gefangen"] … } }
 *   words.json: { Haus: { DAT: { PLU: "Häusern" … }, G: "N" } }
 */

/** Every string inside a nested conjugation/declension table (the gender field "G" is skipped). */
export function collectForms(table: unknown, into: string[] = []): string[] {
  if (typeof table === 'string') {
    if (table) into.push(table)
  } else if (Array.isArray(table)) {
    for (const item of table) collectForms(item, into)
  } else if (table && typeof table === 'object') {
    for (const [field, value] of Object.entries(table)) if (field !== 'G') collectForms(value, into)
  }
  return into
}

/**
 * Keeps only the simplest base words. Separable verbs share forms with their
 * base verb ("er fängt an" → anfangen also uses "fängt"), so the data says
 * "fängt" belongs to fangen, anfangen, abfangen…  A candidate that ends with
 * another candidate is dropped, which leaves just "fangen".
 * Genuinely different bases both stay: "Bäumen" → Baum (noun), bäumen (verb).
 */
export function simplestBases(candidates: Iterable<string>): string[] {
  const unique = [...new Set(candidates)]
  const lower = unique.map((base) => base.toLocaleLowerCase('de'))
  return unique.filter((_, index) =>
    lower.every((other, otherIndex) => otherIndex === index || other.length >= lower[index].length || !lower[index].endsWith(other)),
  )
}

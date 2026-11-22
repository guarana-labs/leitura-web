/**
 * [dictionary branch only] AGID, the "Automatically Generated Inflection Database"
 * (https://wordlist.aspell.net/agid-readme/): English words and their inflected
 * forms. Used by scripts/import-english-forms.ts.
 *
 * One line per base word and part of speech (V verb, N noun, A adjective/adverb):
 *   go V: went | gone | going | goes
 *   be V: was, wast 2 | were | been | being | am | are, art 2 | is | are
 *   can V: could {be_able}, canned {preserve} | canning | can {be_able}, ...
 * Slots are separated by " | ", alternatives by ", ". After a form may come
 * markers (< likely, ~ unlikely, ! probably another word's form, ? not in the word
 * list), a variant level (1 less preferred, 2 archaic/obscure) and a {note}.
 */

export interface AgidEntry {
  base: string
  partOfSpeech: 'V' | 'N' | 'A'
  /** The inflected forms worth showing (archaic, doubtful and unverified ones left out). */
  forms: string[]
}

const LINE = /^(\S+) ([VNA])(\?)?: (.+)$/
const FORM = /^([A-Za-z']+)([<~!?]*)(?: (\d+(?:\.\d+)?))?(?: \{[^}]*\})?$/

/**
 * Reads one line of infl.txt; null for lines to skip. A "?" after the part of speech
 * means AGID wasn't sure of it ("child V?: childed"), so those lines are skipped.
 */
export function parseAgidLine(line: string): AgidEntry | null {
  const match = LINE.exec(line.trim())
  if (!match || match[3]) return null
  const [, base, partOfSpeech, , rest] = match

  const forms: string[] = []
  for (const slot of rest.split(' | ')) {
    for (const item of slot.split(', ')) {
      const form = FORM.exec(item.trim())
      if (!form) continue
      const [, word, markers, level] = form
      if (/[~!?]/.test(markers)) continue // doubtful or unverified
      if (level !== undefined && Number(level) >= 2) continue // archaic or obscure: "wast", "thou art"
      forms.push(word)
    }
  }
  return { base, partOfSpeech: partOfSpeech as AgidEntry['partOfSpeech'], forms }
}

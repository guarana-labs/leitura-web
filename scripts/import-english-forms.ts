/**
 * [dictionary branch only] Imports English inflected forms → base words into the
 * `word_forms` table, replacing any previous English import.
 *
 *   bun run dictionary:import-english-forms <path-to-infl.txt>
 *
 * infl.txt is AGID (https://github.com/en-wl/wordlist/blob/master/agid/infl.txt):
 * "went" → go, "was" → be, "children" → child, "better" → good.
 * Only base words WikDict en-pt can translate are kept, so import it first.
 */
import { readFileSync } from 'node:fs'
import { parseAgidLine } from '../src/lib/dictionary/agid'
import { WIKDICT_EN_PT } from '../src/lib/dictionary/wikdict'
import { getLanguageProfile } from '../src/lib/language'
import { createFormCollector, saveWordForms } from './word-forms-import'

const path = process.argv[2]
const databaseUrl = process.env.DATABASE_URL
if (!path) {
  console.error('Usage: bun run dictionary:import-english-forms <path-to-infl.txt>')
  process.exit(1)
}
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add the Session pooler connection string to .env (see .env.example).')
  process.exit(1)
}

const started = performance.now()
const english = getLanguageProfile('en')
const collector = createFormCollector(english)
for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
  const entry = parseAgidLine(line)
  if (!entry) continue
  collector.addBase(entry.base)
  for (const form of entry.forms) collector.addForm(entry.base, form)
}

await saveWordForms({ profile: english, collector, dictionaries: [WIKDICT_EN_PT], databaseUrl, started })

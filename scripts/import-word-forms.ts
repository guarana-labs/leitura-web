/**
 * [dictionary branch only] Imports German inflected forms → base words into the
 * `word_forms` table, replacing any previous German import.
 *
 *   bun run dictionary:import-forms <path-to-verbs.json> <path-to-words.json>
 *
 * The files come from the npm packages "german-verbs-dict" and "german-words-dict"
 * (dist/verbs.json and dist/words.json), which are based on LanguageTool's German
 * dictionary. Only base words a German dictionary (dict.cc or WikDict de-pt) can
 * translate are kept, so import those first. Run `bun run dictionary:db` to create the table.
 */
import { readFileSync } from 'node:fs'
import { DICTCC_DE_EN } from '../src/lib/dictionary/dictcc'
import { WIKDICT_DE_PT } from '../src/lib/dictionary/wikdict'
import { collectForms } from '../src/lib/dictionary/wordForms'
import { getLanguageProfile } from '../src/lib/language'
import { createFormCollector, saveWordForms } from './word-forms-import'

const [verbsPath, wordsPath] = process.argv.slice(2)
const databaseUrl = process.env.DATABASE_URL
if (!verbsPath || !wordsPath) {
  console.error('Usage: bun run dictionary:import-forms <path-to-verbs.json> <path-to-words.json>')
  process.exit(1)
}
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add the Session pooler connection string to .env (see .env.example).')
  process.exit(1)
}

const started = performance.now()
const german = getLanguageProfile('de')
const collector = createFormCollector(german)
for (const path of [verbsPath, wordsPath]) {
  const tables = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  for (const [base, table] of Object.entries(tables)) {
    collector.addBase(base)
    for (const form of collectForms(table)) collector.addForm(base, form)
  }
}

await saveWordForms({ profile: german, collector, dictionaries: [DICTCC_DE_EN, WIKDICT_DE_PT], databaseUrl, started })

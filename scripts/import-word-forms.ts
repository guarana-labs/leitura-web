/**
 * [dictionary branch only] Imports German inflected forms → base words into the
 * `word_forms` table, replacing any previous import.
 *
 *   bun run dictionary:import-forms <path-to-verbs.json> <path-to-words.json>
 *
 * The files come from the npm packages "german-verbs-dict" and "german-words-dict"
 * (dist/verbs.json and dist/words.json), which are based on LanguageTool's German
 * dictionary. Only base words that dict.cc can translate are kept, so run
 * `bun run dictionary:import` first. Run `bun run dictionary:db` to create the table.
 */
import { readFileSync } from 'node:fs'
import { SQL } from 'bun'
import { DICTCC_DE_EN } from '../src/lib/dictionary/dictcc'
import { collectForms, simplestBases } from '../src/lib/dictionary/wordForms'
import { getLanguageProfile } from '../src/lib/language'

const LANGUAGE = 'de'
const ROWS_PER_STATEMENT = 5000

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
const german = getLanguageProfile(LANGUAGE)

// form key → candidate base words (as written: "fangen", "Haus")
const candidates = new Map<string, Set<string>>()
// key → base words with that spelling ("fangen" → ["fangen"]), to know when a form is itself a base word
const baseWordsByKey = new Map<string, string[]>()
for (const path of [verbsPath, wordsPath]) {
  const tables = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  for (const [base, table] of Object.entries(tables)) {
    const baseKey = german.normalize(base)
    baseWordsByKey.set(baseKey, [...(baseWordsByKey.get(baseKey) ?? []), base])
    for (const form of collectForms(table)) {
      const key = german.normalize(form)
      if (key === baseKey) continue // the base word itself, not an inflected form
      if (!candidates.has(key)) candidates.set(key, new Set())
      candidates.get(key)!.add(base)
    }
  }
}
console.log(`read ${candidates.size} inflected forms`)

const sql = new SQL(databaseUrl)
try {
  // Only keep base words dict.cc can translate (otherwise there is nothing to show).
  const dictKeys = new Set<string>(
    (await sql`select key from public.dictionary_entries where dictionary = ${DICTCC_DE_EN}`).map(
      (row: { key: string }) => row.key,
    ),
  )
  if (dictKeys.size === 0) throw new Error('dict.cc is not imported yet: run `bun run dictionary:import` first.')

  const rows: Array<{ f: string; b: string[] }> = []
  for (const [form, bases] of candidates) {
    // When the form is itself a base word ("fangen" is also a form of anfangen),
    // it takes part in the reduction so the longer verbs drop out, then it's removed:
    // "fangen" ends up with no base words (it is the base), "Bäumen" keeps Baum.
    const self = baseWordsByKey.get(form) ?? []
    const kept = simplestBases([...bases, ...self])
      .filter((base) => german.normalize(base) !== form)
      .filter((base) => dictKeys.has(german.normalize(base)))
    if (kept.length > 0) rows.push({ f: form, b: kept })
  }
  console.log(`${rows.length} forms have a base word in dict.cc`)

  // All or nothing: the old import stays until the new one is complete.
  await sql.begin(async (tx) => {
    await tx`delete from public.word_forms where language = ${LANGUAGE}`
    for (let start = 0; start < rows.length; start += ROWS_PER_STATEMENT) {
      const batch = rows.slice(start, start + ROWS_PER_STATEMENT)
      // Pass the array itself: Bun sends objects as JSON, but a string as a JSON *string*.
      await tx`
        insert into public.word_forms (language, form, bases)
        select ${LANGUAGE}, item->>'f', array(select jsonb_array_elements_text(item->'b'))
        from jsonb_array_elements(${batch}::jsonb) as item`
    }
  })

  const [size] = await sql`
    select pg_size_pretty(pg_total_relation_size('public.word_forms')) as "table",
           pg_size_pretty(pg_database_size(current_database())) as "database"`
  console.log(`done in ${Math.round((performance.now() - started) / 1000)}s — table: ${size.table}, whole database: ${size.database}`)
} finally {
  await sql.close()
}

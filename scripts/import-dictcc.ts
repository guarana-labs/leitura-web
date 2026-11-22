/**
 * [dictionary branch only] Imports a dict.cc German→English export into the
 * `dictionary_entries` table, replacing any previous import.
 *
 *   bun run dictionary:import <path-to-dictcc.txt>
 *
 * Runs on your computer and writes straight to the database in DATABASE_URL.
 * Only single-word headwords are stored (a click is always on one word), grouped
 * by lookup key: one row per word with all its senses, the most common English first.
 * Run `bun run dictionary:db` first to create the table.
 */
import { readFileSync } from 'node:fs'
import { SQL } from 'bun'
import {
  DICTCC_DE_EN,
  dictccKey,
  englishWords,
  parseDictccLine,
  sortByCommonness,
  type DictccEntry,
} from '../src/lib/dictionary/dictcc'

const ROWS_PER_STATEMENT = 2000

const path = process.argv[2]
const databaseUrl = process.env.DATABASE_URL
if (!path) {
  console.error('Usage: bun run dictionary:import <path-to-dictcc.txt>')
  process.exit(1)
}
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add the Session pooler connection string to .env (see .env.example).')
  process.exit(1)
}

const started = performance.now()
const groups = new Map<string, DictccEntry[]>()
// How many senses (phrases included) use each English word: a rough "how common" measure.
const englishCounts = new Map<string, number>()
let lines = 0
let skippedPhrases = 0

for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
  const entry = parseDictccLine(line)
  if (!entry) continue
  lines++
  for (const word of new Set(englishWords(entry[1]))) englishCounts.set(word, (englishCounts.get(word) ?? 0) + 1)
  const key = dictccKey(entry[0])
  if (!key) continue
  if (key.includes(' ')) {
    skippedPhrases++
    continue
  }
  const group = groups.get(key)
  if (group) group.push(entry)
  else groups.set(key, [entry])
}
console.log(`read ${lines} entries: ${groups.size} words kept, ${skippedPhrases} multi-word phrases skipped`)

const rows = [...groups.entries()].map(([key, entries]) => [key, sortByCommonness(entries, englishCounts)] as const)
const sql = new SQL(databaseUrl)
try {
  // All or nothing: the old import stays until the new one is complete.
  await sql.begin(async (tx) => {
    await tx`delete from public.dictionary_entries where dictionary = ${DICTCC_DE_EN}`
    for (let start = 0; start < rows.length; start += ROWS_PER_STATEMENT) {
      const batch = rows.slice(start, start + ROWS_PER_STATEMENT).map(([key, entries]) => ({ k: key, e: entries }))
      // One JSON parameter per statement, expanded into rows by Postgres.
      // (Pass the array itself: Bun sends objects as JSON, but a string as a JSON *string*.)
      await tx`
        insert into public.dictionary_entries (dictionary, key, entries)
        select ${DICTCC_DE_EN}, item->>'k', item->'e'
        from jsonb_array_elements(${batch}::jsonb) as item`
      const done = Math.min(start + ROWS_PER_STATEMENT, rows.length)
      if (done % 50000 < ROWS_PER_STATEMENT || done === rows.length) console.log(`  ${done}/${rows.length}`)
    }
  })

  const [size] = await sql`
    select pg_size_pretty(pg_total_relation_size('public.dictionary_entries')) as "table",
           pg_size_pretty(pg_database_size(current_database())) as "database"`
  console.log(`done in ${Math.round((performance.now() - started) / 1000)}s — table: ${size.table}, whole database: ${size.database}`)
} finally {
  await sql.close()
}

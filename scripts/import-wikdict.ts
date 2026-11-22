/**
 * [dictionary branch only] Imports a WikDict bilingual file into the
 * `dictionary_entries` table, replacing any previous import of that pair.
 *
 *   bun run dictionary:import-wikdict <pair> <path-to-file.sqlite3>
 *   e.g. bun run dictionary:import-wikdict de-pt de-pt.sqlite3
 *
 * Files: https://download.wikdict.com/dictionaries/sqlite/ (e.g. 2_2026-06/de-pt.sqlite3).
 * Only single-word headwords are stored (a click is always on one word), grouped
 * by lookup key, best senses first. Senses with the same translations are merged.
 */
import { Database } from 'bun:sqlite'
import { SQL } from 'bun'
import { partOfSpeechOf, WIKDICT_DE_PT, WIKDICT_EN_PT, type WikdictEntry } from '../src/lib/dictionary/wikdict'
import { getLanguageProfile } from '../src/lib/language'

const ROWS_PER_STATEMENT = 2000
const PAIRS: Record<string, { id: string; language: string }> = {
  'de-pt': { id: WIKDICT_DE_PT, language: 'de' },
  'en-pt': { id: WIKDICT_EN_PT, language: 'en' },
}

const [pair, path] = process.argv.slice(2)
const databaseUrl = process.env.DATABASE_URL
if (!pair || !path || !PAIRS[pair]) {
  console.error(`Usage: bun run dictionary:import-wikdict <${Object.keys(PAIRS).join('|')}> <path-to-file.sqlite3>`)
  process.exit(1)
}
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add the Session pooler connection string to .env (see .env.example).')
  process.exit(1)
}

const started = performance.now()
const { id, language } = PAIRS[pair]
const profile = getLanguageProfile(language)

/** A few texts keep Wiktionary links: "[[bem-estar]] animal" → "bem-estar animal", "[[a|b]]" → "b". */
function withoutWikiLinks(text: string): string {
  return text.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
}

interface SenseRow {
  lexentry: string | null
  written_rep: string
  sense: string | null
  trans_list: string
}

// Best senses first: WikDict's score, then the order of the senses in Wiktionary.
const file = new Database(path, { readonly: true })
const senses = file
  .query(
    `select lexentry, written_rep, sense, trans_list from translation
     where written_rep is not null and trans_list is not null
     order by score desc, lexentry, sense_num`,
  )
  .all() as SenseRow[]
file.close()

const groups = new Map<string, WikdictEntry[]>()
const seen = new Set<string>() // lexentry + translations: merges senses that translate the same way
let skippedPhrases = 0
for (const row of senses) {
  const word = row.written_rep.trim()
  const key = profile.normalize(word)
  if (!key) continue
  if (key.includes(' ')) {
    skippedPhrases++
    continue
  }
  const translations = row.trans_list
    .split(' | ')
    .map((item) => withoutWikiLinks(item).trim())
    .filter(Boolean)
  if (translations.length === 0) continue
  const sameTranslation = `${key}\t${row.lexentry ?? word}\t${translations.join('|')}`
  if (seen.has(sameTranslation)) continue
  seen.add(sameTranslation)

  const explanation = withoutWikiLinks(row.sense ?? '').replace(/\s+/g, ' ').trim()
  const entry: WikdictEntry = [word, partOfSpeechOf(row.lexentry), explanation, translations]
  const group = groups.get(key)
  if (group) group.push(entry)
  else groups.set(key, [entry])
}
console.log(`read ${senses.length} senses: ${groups.size} words kept, ${skippedPhrases} multi-word phrases skipped`)

const rows = [...groups.entries()]
const sql = new SQL(databaseUrl)
try {
  // All or nothing: the old import stays until the new one is complete.
  await sql.begin(async (tx) => {
    await tx`delete from public.dictionary_entries where dictionary = ${id}`
    for (let start = 0; start < rows.length; start += ROWS_PER_STATEMENT) {
      const batch = rows.slice(start, start + ROWS_PER_STATEMENT).map(([key, entries]) => ({ k: key, e: entries }))
      // Pass the array itself: Bun sends objects as JSON, but a string as a JSON *string*.
      await tx`
        insert into public.dictionary_entries (dictionary, key, entries)
        select ${id}, item->>'k', item->'e'
        from jsonb_array_elements(${batch}::jsonb) as item`
    }
  })

  const [size] = await sql`
    select pg_size_pretty(sum(pg_column_size(entries))::bigint) as "entries",
           pg_size_pretty(pg_database_size(current_database())) as "database"
    from public.dictionary_entries where dictionary = ${id}`
  console.log(`done in ${Math.round((performance.now() - started) / 1000)}s — ${id}: ${size.entries} of entries, whole database: ${size.database}`)
} finally {
  await sql.close()
}

/**
 * [dictionary branch only] Shared part of the word-form imports (German and English):
 * collect "inflected form → base words", keep the simplest base, keep only bases a
 * dictionary can translate, and replace the language's rows in `word_forms`.
 */
import { SQL } from 'bun'
import { simplestBases } from '../src/lib/dictionary/wordForms'
import type { LanguageProfile } from '../src/lib/language'

const ROWS_PER_STATEMENT = 5000

/** Collects inflected forms for one language, keyed like the app looks them up. */
export function createFormCollector(profile: LanguageProfile) {
  // form key → candidate base words (as written: "fangen", "Haus", "go")
  const candidates = new Map<string, Set<string>>()
  // key → base words with that spelling ("fangen" → ["fangen"]), to know when a form is itself a base word
  const baseWordsByKey = new Map<string, string[]>()

  return {
    candidates,
    baseWordsByKey,
    addBase(base: string) {
      const key = profile.normalize(base)
      const list = baseWordsByKey.get(key) ?? []
      if (!list.includes(base)) baseWordsByKey.set(key, [...list, base])
    },
    addForm(base: string, form: string) {
      const key = profile.normalize(form)
      if (!key || key === profile.normalize(base)) return // the base word itself, not an inflected form
      if (!candidates.has(key)) candidates.set(key, new Set())
      candidates.get(key)!.add(base)
    },
  }
}

export type FormCollector = ReturnType<typeof createFormCollector>

/**
 * Bases that look up the same dictionary row would show the same section twice
 * ("communists" → Communist, communist): keep one per key, the one with fewer capitals.
 */
function oneSpellingPerKey(bases: string[], profile: LanguageProfile): string[] {
  const capitals = (word: string) => word.replace(/[^\p{Lu}]/gu, '').length
  const byKey = new Map<string, string>()
  for (const base of bases) {
    const key = profile.normalize(base)
    const current = byKey.get(key)
    if (current === undefined || capitals(base) < capitals(current)) byKey.set(key, base)
  }
  return [...byKey.values()]
}

/** Reduces the collected forms and replaces the language's rows in `word_forms`, all or nothing. */
export async function saveWordForms(options: {
  profile: LanguageProfile
  collector: FormCollector
  /** Base words are kept only if one of these dictionaries can translate them. */
  dictionaries: string[]
  databaseUrl: string
  started: number
}) {
  const { profile, collector, dictionaries, databaseUrl, started } = options
  const language = profile.code
  console.log(`read ${collector.candidates.size} inflected forms`)

  const sql = new SQL(databaseUrl)
  try {
    const dictKeys = new Set<string>(
      (
        await sql`select distinct key from public.dictionary_entries
                  where dictionary = any(${dictionaries}::text[])`
      ).map((row: { key: string }) => row.key),
    )
    if (dictKeys.size === 0) throw new Error(`None of ${dictionaries.join(', ')} is imported yet: import them first.`)

    const rows: Array<{ f: string; b: string[] }> = []
    for (const [form, bases] of collector.candidates) {
      // When the form is itself a base word ("fangen" is also a form of anfangen,
      // "saw" is a form of see), it takes part in the reduction so longer words drop
      // out, then it's removed: "fangen" ends up with no base word, "saw" keeps see.
      const self = collector.baseWordsByKey.get(form) ?? []
      const kept = oneSpellingPerKey(
        simplestBases([...bases, ...self])
          .filter((base) => profile.normalize(base) !== form)
          .filter((base) => dictKeys.has(profile.normalize(base))),
        profile,
      )
      if (kept.length > 0) rows.push({ f: form, b: kept })
    }
    console.log(`${rows.length} forms have a base word in ${dictionaries.join(' or ')}`)

    await sql.begin(async (tx) => {
      await tx`delete from public.word_forms where language = ${language}`
      for (let start = 0; start < rows.length; start += ROWS_PER_STATEMENT) {
        const batch = rows.slice(start, start + ROWS_PER_STATEMENT)
        // Pass the array itself: Bun sends objects as JSON, but a string as a JSON *string*.
        await tx`
          insert into public.word_forms (language, form, bases)
          select ${language}, item->>'f', array(select jsonb_array_elements_text(item->'b'))
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
}

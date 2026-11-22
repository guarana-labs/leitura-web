import { DICTCC_DE_EN, type DictccEntry } from '@/lib/dictionary/dictcc'
import { supabase } from '@/lib/supabase'

/**
 * [dictionary branch only] dict.cc German→English, imported on the server by
 * `bun run dictionary:import`. One row per lookup key with all its senses.
 * Returns an empty list when the word isn't in the dictionary.
 */
export async function lookupDictcc(key: string): Promise<DictccEntry[]> {
  const { data, error } = await supabase
    .from('dictionary_entries')
    .select('entries')
    .eq('dictionary', DICTCC_DE_EN)
    .eq('key', key)
    .maybeSingle()

  if (error) throw error
  return (data?.entries as DictccEntry[] | undefined) ?? []
}

import { supabase } from '@/lib/supabase'

/**
 * [dictionary branch only] Dictionaries imported on the server (see scripts/import-*.ts).
 * One row per dictionary and lookup key, with all its senses in that dictionary's
 * format (see src/lib/dictionary/). Returns an empty list when the word isn't there.
 */
export async function lookupDictionary<Entry>(dictionary: string, key: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('dictionary_entries')
    .select('entries')
    .eq('dictionary', dictionary)
    .eq('key', key)
    .maybeSingle()

  if (error) throw error
  return (data?.entries as Entry[] | undefined) ?? []
}

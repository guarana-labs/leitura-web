import { supabase } from '@/lib/supabase'

/**
 * [dictionary branch only] The dictionary the user picked per book language
 * (language → dictionary id). Languages without a choice use their default.
 */
export async function getDictionaryChoices(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('user_dictionaries').select('language, dictionary')
  if (error) throw error
  return new Map(data.map((row) => [row.language, row.dictionary]))
}

/** Saves the dictionary for a language (creates the row on first use). */
export async function saveDictionaryChoice(language: string, dictionary: string): Promise<void> {
  const { error } = await supabase
    .from('user_dictionaries')
    .upsert({ language, dictionary }, { onConflict: 'user_id,language' })
  if (error) throw error
}

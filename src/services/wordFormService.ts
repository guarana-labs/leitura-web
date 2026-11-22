import { supabase } from '@/lib/supabase'

/**
 * [dictionary branch only] The base word(s) an inflected form comes from,
 * e.g. "fängt" → ["fangen"]. Empty when the word isn't a known inflected form
 * (base words themselves, names, unknown words…). See scripts/import-word-forms.ts.
 */
export async function lookupBaseWords(language: string, key: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('word_forms')
    .select('bases')
    .eq('language', language)
    .eq('form', key)
    .maybeSingle()

  if (error) throw error
  return data?.bases ?? []
}

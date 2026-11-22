import { supabase } from '@/lib/supabase'
import type { UserWord, WordStatus } from '@/types/vocabulary'

/** Keeps each request's URL short (`word=in.(...)` lists every word). */
const WORDS_PER_REQUEST = 150

/**
 * Loads the user's marks for a set of (normalized) words in one language.
 * Words missing from the result are NEW.
 */
export async function getUserWords(language: string, words: string[]): Promise<Map<string, UserWord>> {
  const result = new Map<string, UserWord>()
  for (let start = 0; start < words.length; start += WORDS_PER_REQUEST) {
    const batch = words.slice(start, start + WORDS_PER_REQUEST)
    const { data, error } = await supabase
      .from('user_words')
      .select('word, status, meaning')
      .eq('language', language)
      .in('word', batch)

    if (error) throw error
    for (const row of data) result.set(row.word, { status: row.status, meaning: row.meaning })
  }
  return result
}

/** Saves a word's status and meaning (creates the row on first use). */
export async function saveUserWord(
  language: string,
  word: string,
  value: { status: WordStatus; meaning: string | null },
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('user_words')
    .upsert(
      { user_id: userId, language, word, status: value.status, meaning: value.meaning },
      { onConflict: 'user_id,language,word' },
    )
  if (error) throw error
}

import { supabase } from '@/lib/supabase'

/** Remembers the last page the user read in a book (one row per user and book). */
export async function saveProgress(bookId: string, pageNumber: number): Promise<{ updatedAt: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('reading_progress')
    .upsert({ user_id: userId, book_id: bookId, page_number: pageNumber }, { onConflict: 'user_id,book_id' })
    .select('updated_at')
    .single()

  if (error) throw error
  return { updatedAt: data.updated_at }
}

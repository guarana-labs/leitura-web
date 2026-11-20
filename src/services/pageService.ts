import { supabase } from '@/lib/supabase'
import type { BookPage } from '@/types/book'

/** Loads a single page of a book (the reader never loads the whole text). Null if it doesn't exist. */
export async function getPage(bookId: string, pageNumber: number): Promise<BookPage | null> {
  const { data, error } = await supabase
    .from('pages')
    .select('book_id, chapter_id, page_number, paragraphs, word_count')
    .eq('book_id', bookId)
    .eq('page_number', pageNumber)
    .maybeSingle()

  if (error) {
    if (error.code === '22P02') return null
    throw error
  }
  if (!data) return null

  return {
    bookId: data.book_id,
    chapterId: data.chapter_id,
    pageNumber: data.page_number,
    paragraphs: data.paragraphs,
    wordCount: data.word_count,
  }
}

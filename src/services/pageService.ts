import { supabase } from '@/lib/supabase'
import type { BookPage, PageSummary } from '@/types/book'

/** Supabase returns at most this many rows per request by default. */
const ROWS_PER_REQUEST = 1000

/**
 * Lists a book's pages for the index: number and word count only, never the text.
 * Long books are fetched in batches, since one request returns at most 1000 rows.
 */
export async function listPageSummaries(bookId: string): Promise<PageSummary[]> {
  const summaries: PageSummary[] = []

  for (let from = 0; ; from += ROWS_PER_REQUEST) {
    const { data, error } = await supabase
      .from('pages')
      .select('page_number, word_count')
      .eq('book_id', bookId)
      .order('page_number', { ascending: true })
      .range(from, from + ROWS_PER_REQUEST - 1)

    if (error) throw error
    summaries.push(...data.map((row) => ({ pageNumber: row.page_number, wordCount: row.word_count })))
    if (data.length < ROWS_PER_REQUEST) return summaries
  }
}

/** Loads a single page of a book (the reader never loads the whole text). Null if it doesn't exist. */
export async function getPage(bookId: string, pageNumber: number): Promise<BookPage | null> {
  const { data, error } = await supabase
    .from('pages')
    .select('book_id, page_number, paragraphs, word_count')
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
    pageNumber: data.page_number,
    paragraphs: data.paragraphs,
    wordCount: data.word_count,
  }
}

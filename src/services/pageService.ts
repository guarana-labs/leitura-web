import { supabase } from '@/lib/supabase'
import type { BookPage, PageImage, PageSummary } from '@/types/book'
import type { Json } from '@/types/database'

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
    .select('book_id, page_number, paragraphs, images, word_count')
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
    images: toPageImages(data.images),
    wordCount: data.word_count,
  }
}

/** Reads the `images` column, skipping anything malformed rather than breaking the page. */
function toPageImages(value: Json): PageImage[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const { path, alt, width, height, before } = item
    if (typeof path !== 'string' || typeof before !== 'number') return []
    return [
      {
        path,
        alt: typeof alt === 'string' ? alt : '',
        width: typeof width === 'number' ? width : 0,
        height: typeof height === 'number' ? height : 0,
        before,
      },
    ]
  })
}

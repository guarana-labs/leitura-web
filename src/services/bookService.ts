import { supabase } from '@/lib/supabase'
import { getCoverUrls, removeCover } from '@/services/coverService'
import { mapBookRow } from '@/services/mappers'
import type { Book, BookSummary } from '@/types/book'

/**
 * Lists the signed-in user's books with cover URLs and reading progress,
 * most recently read first, then most recently added.
 */
export async function listBooks(): Promise<BookSummary[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*, reading_progress(page_number, updated_at)')
    .order('created_at', { ascending: false })

  if (error) throw error

  const coverPaths = data.flatMap((row) => (row.cover_path ? [row.cover_path] : []))
  // A cover failing to load should never hide the library.
  const coverUrls = await getCoverUrls(coverPaths).catch(() => new Map<string, string>())

  const books = data.map((row): BookSummary => {
    // RLS limits progress to the current user, so there is at most one row.
    const progress = row.reading_progress[0]
    return {
      ...mapBookRow(row),
      coverUrl: row.cover_path ? (coverUrls.get(row.cover_path) ?? null) : null,
      currentPage: progress?.page_number ?? null,
      lastReadAt: progress?.updated_at ?? null,
    }
  })

  return books.sort(compareByRecentActivity)
}

/** Deletes a book with its chapters, pages and progress (cascade), plus its cover file. */
export async function deleteBook(book: Pick<Book, 'id' | 'coverPath'>): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', book.id)
  if (error) throw error

  if (book.coverPath) {
    // The book is already gone; an orphaned cover file is harmless, so don't fail the delete.
    await removeCover(book.coverPath).catch(() => undefined)
  }
}

function compareByRecentActivity(a: BookSummary, b: BookSummary): number {
  const aTime = Date.parse(a.lastReadAt ?? a.createdAt)
  const bTime = Date.parse(b.lastReadAt ?? b.createdAt)
  return bTime - aTime
}

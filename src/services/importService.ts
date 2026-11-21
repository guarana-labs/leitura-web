import { supabase } from '@/lib/supabase'
import { uploadCover } from '@/services/coverService'
import type { BookImport } from '@/types/book'

export interface ImportResult {
  bookId: string
  /** True when the book was saved but its cover could not be uploaded. */
  coverFailed: boolean
}

/**
 * Saves an extracted book: text first (one transaction via `import_book`),
 * then the optional cover. A failed cover upload never loses the book.
 */
export async function saveImportedBook(book: BookImport, cover: Blob | null): Promise<ImportResult> {
  const { data: bookId, error } = await supabase.rpc('import_book', {
    p_book: {
      title: book.metadata.title,
      author: book.metadata.author ?? null,
      description: book.metadata.description ?? null,
      language: book.metadata.language ?? null,
      words_per_page: book.wordsPerPage,
    },
    p_pages: book.pages,
  })
  if (error) throw error

  if (!cover) return { bookId, coverFailed: false }

  try {
    const path = await uploadCover(bookId, cover)
    const { error: updateError } = await supabase.from('books').update({ cover_path: path }).eq('id', bookId)
    if (updateError) throw updateError
    return { bookId, coverFailed: false }
  } catch {
    return { bookId, coverFailed: true }
  }
}

import { COVERS_BUCKET, supabase } from '@/lib/supabase'
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
    p_chapters: book.chapters.map((chapter) => ({ pages: chapter.pages })),
  })
  if (error) throw error

  if (!cover) return { bookId, coverFailed: false }

  try {
    await uploadCover(bookId, cover)
    return { bookId, coverFailed: false }
  } catch {
    return { bookId, coverFailed: true }
  }
}

async function uploadCover(bookId: string, cover: Blob): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Not authenticated')

  // Storage policies only allow writing inside the user's own folder.
  const path = `${userId}/${bookId}.webp`
  const { error: uploadError } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, cover, { contentType: 'image/webp', upsert: true })
  if (uploadError) throw uploadError

  const { error: updateError } = await supabase.from('books').update({ cover_path: path }).eq('id', bookId)
  if (updateError) throw updateError
}

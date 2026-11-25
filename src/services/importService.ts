import { supabase } from '@/lib/supabase'
import { removeBookImages, uploadBookImages, type ImageProgressCallback } from '@/services/bookImageService'
import { uploadCover } from '@/services/coverService'
import type { BookImport, PageImage } from '@/types/book'
import type { Json } from '@/types/database'

export interface ImportResult {
  bookId: string
  /** True when the book was saved but its cover could not be uploaded. */
  coverFailed: boolean
  /** Images left out because their files couldn't be read. */
  unreadableImages: number
}

/**
 * Saves an extracted book: its images first (so the pages can point to them),
 * then the text in one transaction via `import_book`, then the optional cover.
 * If saving the text fails, the uploaded images are removed. A failed cover
 * upload never loses the book.
 */
export async function saveImportedBook(
  book: BookImport,
  cover: Blob | null,
  onImageProgress?: ImageProgressCallback,
): Promise<ImportResult> {
  // Chosen here, so the images' folder can be named after the book before it exists.
  const bookId = crypto.randomUUID()

  const usedImages = new Map<string, Blob>()
  for (const page of book.pages) {
    for (const image of page.images) {
      const file = book.images.get(image.file)
      if (file) usedImages.set(image.file, file)
    }
  }
  const { stored, unreadable } =
    usedImages.size > 0
      ? await uploadBookImages(bookId, usedImages, onImageProgress)
      : { stored: new Map(), unreadable: [] }

  const pages = book.pages
    .map((page) => ({
      paragraphs: page.paragraphs,
      images: page.images.flatMap((image): PageImage[] => {
        const file = stored.get(image.file)
        return file ? [{ path: file.path, alt: image.alt, width: file.width, height: file.height, before: image.before }] : []
      }),
    }))
    // A page that only had unreadable images would be empty.
    .filter((page) => page.paragraphs.length > 0 || page.images.length > 0)

  const { error } = await supabase.rpc('import_book', {
    p_book: {
      id: bookId,
      title: book.metadata.title,
      author: book.metadata.author ?? null,
      description: book.metadata.description ?? null,
      language: book.metadata.language ?? null,
      words_per_page: book.wordsPerPage,
    },
    p_pages: pages as unknown as Json,
  })
  if (error) {
    if (stored.size > 0) await removeBookImages(bookId).catch(() => undefined)
    throw error
  }

  const result = { bookId, coverFailed: false, unreadableImages: unreadable.length }
  if (!cover) return result

  try {
    const path = await uploadCover(bookId, cover)
    const { error: updateError } = await supabase.from('books').update({ cover_path: path }).eq('id', bookId)
    if (updateError) throw updateError
    return result
  } catch {
    return { ...result, coverFailed: true }
  }
}

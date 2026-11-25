import { supabase } from '@/lib/supabase'
import { removeBookImages } from '@/services/bookImageService'
import { getCoverUrls, removeCover, uploadCover } from '@/services/coverService'
import { mapBookRow } from '@/services/mappers'
import type { Book, BookSummary } from '@/types/book'
import type { TableRow } from '@/types/database'

const BOOK_WITH_PROGRESS = '*, reading_progress(page_number, updated_at)'

type BookRowWithProgress = TableRow<'books'> & {
  reading_progress: Array<Pick<TableRow<'reading_progress'>, 'page_number' | 'updated_at'>>
}

/**
 * Lists the signed-in user's books with cover URLs and reading progress,
 * most recently read first, then most recently added.
 */
export async function listBooks(): Promise<BookSummary[]> {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_WITH_PROGRESS)
    .order('created_at', { ascending: false })

  if (error) throw error

  const coverUrls = await loadCoverUrls(data)
  return data.map((row) => toBookSummary(row, coverUrls)).sort(compareByRecentActivity)
}

/** One book with cover URL and progress, or null when it doesn't exist (or isn't the user's). */
export async function getBook(bookId: string): Promise<BookSummary | null> {
  const { data, error } = await supabase.from('books').select(BOOK_WITH_PROGRESS).eq('id', bookId).maybeSingle()

  if (error) {
    // An id that isn't a valid UUID can't match any book.
    if (error.code === '22P02') return null
    throw error
  }
  if (!data) return null

  const coverUrls = await loadCoverUrls([data])
  return toBookSummary(data, coverUrls)
}

export interface BookMetadataUpdate {
  title: string
  author: string | null
  description: string | null
  language: string | null
}

/** What to do with the cover when saving an edit. */
export type CoverUpdate = { type: 'keep' } | { type: 'replace'; blob: Blob } | { type: 'remove' }

/** The details were saved, but the new cover could not be uploaded. */
export class CoverUploadError extends Error {
  constructor(cause: unknown) {
    super('The book was updated, but its cover could not be uploaded.', { cause })
    this.name = 'CoverUploadError'
  }
}

/**
 * Updates a book's details and cover. The text (its pages) never changes.
 * Old cover files are removed after the book points to the new state, so a failure
 * never leaves the book pointing at a missing file.
 */
export async function updateBook(
  book: Pick<Book, 'id' | 'coverPath'>,
  metadata: BookMetadataUpdate,
  cover: CoverUpdate,
): Promise<void> {
  const { error } = await supabase
    .from('books')
    .update({ ...metadata, ...(cover.type === 'remove' ? { cover_path: null } : {}) })
    .eq('id', book.id)
  if (error) throw error

  if (cover.type === 'replace') {
    try {
      const path = await uploadCover(book.id, cover.blob)
      const { error: coverError } = await supabase.from('books').update({ cover_path: path }).eq('id', book.id)
      if (coverError) throw coverError
    } catch (uploadError) {
      throw new CoverUploadError(uploadError)
    }
  }

  const oldCoverIsUnused = cover.type !== 'keep' && book.coverPath
  if (oldCoverIsUnused) {
    // An orphaned file is harmless, so this never fails the save.
    await removeCover(book.coverPath!).catch(() => undefined)
  }
}

/** Deletes a book with its pages and progress (cascade), plus its cover and image files. */
export async function deleteBook(book: Pick<Book, 'id' | 'coverPath'>): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', book.id)
  if (error) throw error

  // The book is already gone; orphaned files are harmless, so don't fail the delete.
  await Promise.all([
    book.coverPath ? removeCover(book.coverPath).catch(() => undefined) : undefined,
    removeBookImages(book.id).catch(() => undefined),
  ])
}

async function loadCoverUrls(rows: TableRow<'books'>[]): Promise<Map<string, string>> {
  const paths = rows.flatMap((row) => (row.cover_path ? [row.cover_path] : []))
  // A cover failing to load should never hide the book.
  return getCoverUrls(paths).catch(() => new Map<string, string>())
}

function toBookSummary(row: BookRowWithProgress, coverUrls: Map<string, string>): BookSummary {
  // RLS limits progress to the current user, so there is at most one row.
  const progress = row.reading_progress[0]
  return {
    ...mapBookRow(row),
    coverUrl: row.cover_path ? (coverUrls.get(row.cover_path) ?? null) : null,
    currentPage: progress?.page_number ?? null,
    lastReadAt: progress?.updated_at ?? null,
  }
}

function compareByRecentActivity(a: BookSummary, b: BookSummary): number {
  const aTime = Date.parse(a.lastReadAt ?? a.createdAt)
  const bTime = Date.parse(b.lastReadAt ?? b.createdAt)
  return bTime - aTime
}

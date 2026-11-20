/**
 * Domain types used by the UI. Services map database rows into these shapes,
 * so components never depend on database column names.
 */

export interface Book {
  id: string
  title: string
  author: string | null
  description: string | null
  language: string | null
  coverPath: string | null
  wordsPerPage: number
  totalWords: number
  totalPages: number
  totalChapters: number
  createdAt: string
  updatedAt: string
}

/** A book as shown in the library: metadata plus cover URL and reading progress. */
export interface BookSummary extends Book {
  /** Short-lived signed URL for the cover image, or null when there is no cover. */
  coverUrl: string | null
  /** Last page read, or null when the book was never opened. */
  currentPage: number | null
  lastReadAt: string | null
}

/** A numbered section of a book. Shown as "Chapter {position}"; it has no title of its own. */
export interface Chapter {
  id: string
  bookId: string
  position: number
  firstPage: number
  lastPage: number
  wordCount: number
}

export interface BookPage {
  bookId: string
  chapterId: string
  pageNumber: number
  paragraphs: string[]
  wordCount: number
}

export interface ReadingProgress {
  bookId: string
  pageNumber: number
  updatedAt: string
}

/** Input for `import_book`: what the browser produces after extracting a PDF. */
export interface BookImport {
  metadata: {
    title: string
    author?: string
    description?: string
    language?: string
  }
  wordsPerPage: number
  chapters: Array<{
    /** Each page is a list of paragraphs. */
    pages: string[][]
  }>
}

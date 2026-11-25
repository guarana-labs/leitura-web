/**
 * Domain types used by the UI. Services map database rows into these shapes,
 * so components never depend on database column names.
 */

import type { Page } from '@/lib/pagination/paginate'

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

/** A page as listed in the book's index (without its text). */
export interface PageSummary {
  pageNumber: number
  wordCount: number
}

/** An image on a saved page. */
export interface PageImage {
  /** Path in the `book-images` storage bucket. */
  path: string
  alt: string
  width: number
  height: number
  /** Index of the paragraph the image comes before; equals the paragraph count when it's at the end. */
  before: number
}

/** One page of a book: about `wordsPerPage` words, never cutting a paragraph. */
export interface BookPage {
  bookId: string
  pageNumber: number
  paragraphs: string[]
  images: PageImage[]
  wordCount: number
}

export interface ReadingProgress {
  bookId: string
  pageNumber: number
  updatedAt: string
}

/** What the browser produces after extracting a book file, ready to be saved. */
export interface BookImport {
  metadata: {
    title: string
    author?: string
    description?: string
    language?: string
  }
  wordsPerPage: number
  /** The book's pages in order. */
  pages: Page[]
  /** Image files the pages use (original format), by the key in `PageImageRef.file`. */
  images: Map<string, Blob>
}

import type { ProgressCallback, SourceBook } from '@/lib/import/sourceBook'

export type BookFileKind = 'pdf' | 'epub'

/** Accept attribute for file inputs. */
export const BOOK_FILE_ACCEPT = '.pdf,.epub,application/pdf,application/epub+zip'

export function detectBookFileKind(file: File): BookFileKind | null {
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') return 'pdf'
  if (/\.epub$/i.test(file.name) || file.type === 'application/epub+zip') return 'epub'
  return null
}

/**
 * Reads a supported book file in the browser. Each reader is loaded on demand,
 * so pdf.js / the unzip library are only downloaded when someone imports a book.
 */
export async function readBookFile(file: File, kind: BookFileKind, onProgress?: ProgressCallback): Promise<SourceBook> {
  if (kind === 'pdf') {
    const { readPdfBook } = await import('@/lib/pdf/readPdfBook')
    return readPdfBook(file, onProgress)
  }
  const { readEpubBook } = await import('@/lib/epub/readEpubBook')
  return readEpubBook(file, onProgress)
}

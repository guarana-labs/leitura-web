/**
 * What every file reader (PDF, EPUB, ...) produces: the book's text as chapters
 * of paragraphs, plus metadata suggestions the user can change before saving.
 */

export interface ExtractedChapter {
  paragraphs: string[]
}

export interface SourceBook {
  metadata: {
    title: string
    author: string
    /** Language tag from the file (e.g. "pt", "de-DE"), when it has one. */
    language: string | null
  }
  chapters: ExtractedChapter[]
}

/** Reports extraction progress from 0 to 1. */
export type ProgressCallback = (fraction: number) => void

/** The file has no readable text (e.g. a scanned PDF). */
export class NoTextError extends Error {
  constructor() {
    super('The file has no extractable text.')
    this.name = 'NoTextError'
  }
}

/** The file is password protected or DRM-encrypted. */
export class ProtectedFileError extends Error {
  constructor() {
    super('The file is protected (password or DRM).')
    this.name = 'ProtectedFileError'
  }
}

export function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.(pdf|epub)$/i, '')
    .replace(/[_]+/g, ' ')
    .trim()
}

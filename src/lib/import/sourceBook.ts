/**
 * What every file reader (PDF, EPUB, ...) produces: the book's text as
 * paragraphs and images, plus metadata suggestions the user can
 * change before saving.
 */

/** An image in the text. `file` is a key into `SourceBook.images`. */
export interface SourceImage {
  type: 'image'
  file: string
  alt: string
  /** Size in pixels, when the browser could read it (not for every SVG). */
  width?: number
  height?: number
}

/** A paragraph of text, or an image between paragraphs. */
export type SourceBlock = string | SourceImage

/** An image file as found in the book (original format), before it's converted for upload. */
export type SourceImageFile = Blob

export interface SourceBook {
  metadata: {
    title: string
    author: string
    /** Language tag from the file (e.g. "pt", "de-DE"), when it has one. */
    language: string | null
  }
  /**
   * The content in reading order, as groups of blocks. Each group starts on a
   * new page. A PDF is one group; an EPUB has one per document, because its
   * files are the book's own divisions.
   */
  sections: SourceBlock[][]
  /** Image files used in `sections`, by key. Each file appears once, however often it's used. */
  images: Map<string, SourceImageFile>
  /** The cover image the file declares (original format, not cropped), if any. */
  cover: Blob | null
  /**
   * True for fixed-layout EPUBs (comics, picture books): pages are designed as
   * pictures with text placed on top, which can't be split into paragraphs well.
   */
  fixedLayout: boolean
}

export function isImageBlock(block: SourceBlock): block is SourceImage {
  return typeof block !== 'string'
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

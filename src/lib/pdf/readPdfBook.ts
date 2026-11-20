import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { extractBook, type ExtractedChapter } from '@/lib/pdf/extractBook'

// pdf.js parses the file in its own Web Worker, so the page stays responsive.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export interface PdfBook {
  /** Suggestions from the PDF's metadata; the user can change them. */
  metadata: { title: string; author: string }
  chapters: ExtractedChapter[]
  pdfPageCount: number
}

export class PdfPasswordError extends Error {
  constructor() {
    super('The PDF is password protected.')
    this.name = 'PdfPasswordError'
  }
}

/**
 * Reads a PDF file entirely in the browser and returns its text as chapters.
 * The file itself is never uploaded or stored.
 */
export async function readPdfBook(file: File, onProgress?: (page: number, total: number) => void): Promise<PdfBook> {
  const data = new Uint8Array(await file.arrayBuffer())

  const loadingTask = pdfjs.getDocument({ data, verbosity: 0 })
  let pdf: pdfjs.PDFDocumentProxy
  try {
    pdf = await loadingTask.promise
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') throw new PdfPasswordError()
    throw error
  }

  try {
    const [book, metadata] = await Promise.all([extractBook(pdf, onProgress), readMetadata(pdf)])
    return {
      metadata: {
        title: metadata.title || titleFromFileName(file.name),
        author: metadata.author,
      },
      chapters: book.chapters,
      pdfPageCount: book.pageCount,
    }
  } finally {
    // Frees the parsed document in the pdf.js worker.
    void loadingTask.destroy()
  }
}

async function readMetadata(pdf: pdfjs.PDFDocumentProxy): Promise<{ title: string; author: string }> {
  try {
    const { info } = await pdf.getMetadata()
    const fields = info as { Title?: unknown; Author?: unknown }
    return {
      title: typeof fields.Title === 'string' ? fields.Title.trim() : '',
      author: typeof fields.Author === 'string' ? fields.Author.trim() : '',
    }
  } catch {
    return { title: '', author: '' }
  }
}

function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').trim()
}

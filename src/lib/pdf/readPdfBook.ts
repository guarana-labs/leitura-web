import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ProtectedFileError, titleFromFileName, type ProgressCallback, type SourceBook } from '@/lib/import/sourceBook'
import { extractBook } from '@/lib/pdf/extractBook'

// pdf.js parses the file in its own Web Worker, so the page stays responsive.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Reads a PDF file entirely in the browser and returns its text as paragraphs.
 * The file itself is never uploaded or stored.
 */
export async function readPdfBook(file: File, onProgress?: ProgressCallback): Promise<SourceBook> {
  const data = new Uint8Array(await file.arrayBuffer())

  const loadingTask = pdfjs.getDocument({ data, verbosity: 0 })
  let pdf: pdfjs.PDFDocumentProxy
  try {
    pdf = await loadingTask.promise
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') throw new ProtectedFileError()
    throw error
  }

  try {
    const [book, metadata] = await Promise.all([extractBook(pdf, onProgress), readMetadata(pdf)])
    return {
      metadata: {
        title: metadata.title || titleFromFileName(file.name),
        author: metadata.author,
        language: null,
      },
      sections: [book.paragraphs],
      // PDF images aren't extracted (yet).
      images: new Map(),
      // PDFs don't declare a cover.
      cover: null,
      fixedLayout: false,
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

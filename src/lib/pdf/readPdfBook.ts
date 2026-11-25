import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ProtectedFileError, titleFromFileName, type ProgressCallback, type SourceBook } from '@/lib/import/sourceBook'
import { extractBook } from '@/lib/pdf/extractBook'
import { readPageImages } from '@/lib/pdf/pdfImages'

// pdf.js parses the file in its own Web Worker, so the page stays responsive.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Reads a PDF file entirely in the browser and returns its text as paragraphs,
 * with its images between them. The first page is offered as the cover.
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
    const images = new Map<string, Blob>()
    const readImages = async (pageNumber: number) => readPageImages(await pdf.getPage(pageNumber), pageNumber, images)
    const [book, metadata, cover] = await Promise.all([
      extractBook(pdf, onProgress, readImages),
      readMetadata(pdf),
      renderFirstPage(pdf),
    ])
    return {
      metadata: {
        title: metadata.title || titleFromFileName(file.name),
        author: metadata.author,
        language: null,
      },
      sections: [book.blocks],
      images,
      cover,
      fixedLayout: false,
    }
  } finally {
    // Frees the parsed document in the pdf.js worker.
    void loadingTask.destroy()
  }
}

/** Width of the cover picture rendered from the first page. */
const COVER_WIDTH = 800

/** PDFs don't declare a cover, so the first page is offered as one (the user can change or remove it). */
async function renderFirstPage(pdf: pdfjs.PDFDocumentProxy): Promise<Blob | null> {
  try {
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: COVER_WIDTH / page.getViewport({ scale: 1 }).width })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    await page.render({ canvas, viewport }).promise
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  } catch {
    return null
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

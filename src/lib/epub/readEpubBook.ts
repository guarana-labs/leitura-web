import { strFromU8, unzipSync } from 'fflate'
import {
  NoTextError,
  ProtectedFileError,
  titleFromFileName,
  type ProgressCallback,
  type SourceBook,
} from '@/lib/import/sourceBook'

/**
 * Reads an EPUB entirely in the browser. An EPUB is a zip of XHTML documents plus
 * a package file (OPF) that lists them in reading order (the "spine").
 *
 * Simple rules (to be improved over time):
 * - Each document in the spine becomes one section (it starts on a new page);
 *   non-linear ones (like the cover page) and documents without text are skipped.
 * - Paragraphs are the innermost block elements (<p>, <h1>…, <li>, <div>, ...).
 * - Images, footnote links and formatting are dropped; only text is kept.
 */
export async function readEpubBook(file: File, onProgress?: ProgressCallback): Promise<SourceBook> {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const readText = (path: string) => (files[path] ? strFromU8(files[path]) : null)

  if (isDrmProtected(readText)) throw new ProtectedFileError()

  const opfPath = findPackagePath(readText('META-INF/container.xml'))
  const opfXml = opfPath ? readText(opfPath) : null
  if (!opfPath || !opfXml) throw new Error('Invalid EPUB: package file not found')

  const opf = parseXml(opfXml)
  const metadata = readMetadata(opf)
  const documents = readSpine(opf, opfPath)

  const sections: string[][] = []
  for (const [index, path] of documents.entries()) {
    const html = readText(path)
    if (html) {
      const paragraphs = extractParagraphs(html)
      if (paragraphs.length > 0) sections.push(paragraphs)
    }
    onProgress?.((index + 1) / documents.length)
    // Let the browser repaint the progress bar between documents.
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  if (sections.length === 0) throw new NoTextError()

  return {
    metadata: {
      title: metadata.title || titleFromFileName(file.name),
      author: metadata.authors.join(', '),
      language: metadata.language,
    },
    sections,
  }
}

// ---------------------------------------------------------------------------
// Package (OPF)
// ---------------------------------------------------------------------------

const DC_NS = 'http://purl.org/dc/elements/1.1/'
const FONT_FILE = /\.(otf|ttf|woff2?)$/i

/**
 * DRM-protected EPUBs encrypt their text documents. (Many EPUBs only "encrypt"
 * fonts to deter copying them; that is not DRM and is ignored.)
 */
function isDrmProtected(readText: (path: string) => string | null): boolean {
  if (readText('META-INF/rights.xml')) return true
  const encryption = readText('META-INF/encryption.xml')
  if (!encryption) return false
  const uris = [...encryption.matchAll(/CipherReference[^>]*URI="([^"]+)"/g)].map((match) => match[1])
  return uris.some((uri) => !FONT_FILE.test(uri))
}

function findPackagePath(containerXml: string | null): string | null {
  if (!containerXml) return null
  const rootfile = parseXml(containerXml).getElementsByTagNameNS('*', 'rootfile')[0]
  return rootfile?.getAttribute('full-path') ?? null
}

function readMetadata(opf: Document): { title: string; authors: string[]; language: string | null } {
  const texts = (name: string) =>
    [...opf.getElementsByTagNameNS(DC_NS, name)].map((element) => normalizeSpace(element.textContent ?? '')).filter(Boolean)

  return {
    title: texts('title')[0] ?? '',
    authors: texts('creator').map(displayName),
    language: texts('language')[0] ?? null,
  }
}

/** "Levitsky, Steven" → "Steven Levitsky" (only for the simple "Last, First" form). */
function displayName(name: string): string {
  const parts = name.split(',').map((part) => part.trim())
  return parts.length === 2 && parts[0] && parts[1] ? `${parts[1]} ${parts[0]}` : name
}

/** Paths (inside the zip) of the documents to read, in reading order. */
function readSpine(opf: Document, opfPath: string): string[] {
  const manifest = new Map<string, { href: string; mediaType: string }>()
  for (const item of opf.getElementsByTagNameNS('*', 'item')) {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    if (id && href) manifest.set(id, { href, mediaType: item.getAttribute('media-type') ?? '' })
  }

  const paths: string[] = []
  for (const itemref of opf.getElementsByTagNameNS('*', 'itemref')) {
    if (itemref.getAttribute('linear') === 'no') continue
    const entry = manifest.get(itemref.getAttribute('idref') ?? '')
    if (entry && /html/.test(entry.mediaType)) paths.push(resolvePath(opfPath, entry.href))
  }
  return paths
}

/** Resolves an href relative to the OPF file into a path inside the zip. */
function resolvePath(opfPath: string, href: string): string {
  const url = new URL(href, `https://epub.local/${opfPath}`)
  return decodeURIComponent(url.pathname.slice(1))
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const BLOCKS = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div, dd, dt, figcaption, td'

function extractParagraphs(html: string): string[] {
  const document = parseHtml(html)
  const body = document.body ?? document.documentElement

  // Line breaks inside a paragraph would otherwise glue words together.
  for (const br of [...body.querySelectorAll('br')]) br.replaceWith(' ')

  // Innermost blocks only, so nested blocks don't repeat their text.
  const blocks = [...body.querySelectorAll(BLOCKS)].filter((element) => !element.querySelector(BLOCKS))
  const sources = blocks.length > 0 ? blocks : [body]

  return sources.map((element) => normalizeSpace(element.textContent ?? '')).filter(Boolean)
}

function parseHtml(html: string): Document {
  // EPUB documents are XHTML; fall back to the forgiving HTML parser if one isn't well-formed.
  const xhtml = new DOMParser().parseFromString(html, 'application/xhtml+xml')
  if (!xhtml.getElementsByTagName('parsererror').length) return xhtml
  return new DOMParser().parseFromString(html, 'text/html')
}

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, 'application/xml')
}

function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

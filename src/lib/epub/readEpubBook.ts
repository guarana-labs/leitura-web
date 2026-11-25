import { strFromU8, unzipSync, type Unzipped } from 'fflate'
import {
  NoTextError,
  ProtectedFileError,
  titleFromFileName,
  type ProgressCallback,
  type SourceBlock,
  type SourceBook,
} from '@/lib/import/sourceBook'

/**
 * Reads an EPUB entirely in the browser. An EPUB is a zip of XHTML documents plus
 * a package file (OPF) that lists them in reading order (the "spine").
 *
 * Simple rules (to be improved over time):
 * - Each document in the spine becomes one section (it starts on a new page);
 *   non-linear ones and documents with neither text nor images are skipped.
 * - Paragraphs are the innermost block elements (<p>, <h1>…, <li>, <div>, ...).
 * - Images (<img>, and <image> inside <svg>) are kept in reading order. An image
 *   inside a paragraph is placed just before that paragraph.
 * - Footnote links and formatting are dropped.
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
  const { documents, mediaTypes } = readManifest(opf, opfPath)
  const images: SourceBook['images'] = new Map()
  const addImage = (path: string) => loadImage(path, files, mediaTypes, images)

  const sections: SourceBlock[][] = []
  for (const [index, path] of documents.entries()) {
    const html = readText(path)
    if (html) {
      const blocks = extractBlocks(html, path, addImage)
      if (blocks.length > 0) sections.push(blocks)
    }
    onProgress?.((index + 1) / documents.length)
    // Let the browser repaint the progress bar between documents.
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  // Images alone don't make a readable book.
  const hasText = sections.some((blocks) => blocks.some((block) => typeof block === 'string'))
  if (!hasText) throw new NoTextError()

  // Image sizes let pagination tell a small ornament from a full-page photo.
  const sizes = await measureImages(images)
  for (const block of sections.flat()) {
    if (typeof block !== 'string') Object.assign(block, sizes.get(block.file))
  }

  return {
    metadata: {
      title: metadata.title || titleFromFileName(file.name),
      author: metadata.authors.join(', '),
      language: metadata.language,
    },
    sections,
    images,
    fixedLayout: /pre-paginated/.test(opfXml),
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

/**
 * The documents to read, in reading order, and the media type of every file
 * listed in the package (paths inside the zip).
 */
function readManifest(opf: Document, opfPath: string): { documents: string[]; mediaTypes: Map<string, string> } {
  const manifest = new Map<string, { path: string; mediaType: string }>()
  const mediaTypes = new Map<string, string>()
  for (const item of opf.getElementsByTagNameNS('*', 'item')) {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    if (!id || !href) continue
    const entry = { path: resolvePath(opfPath, href), mediaType: item.getAttribute('media-type') ?? '' }
    manifest.set(id, entry)
    mediaTypes.set(entry.path, entry.mediaType)
  }

  const documents: string[] = []
  for (const itemref of opf.getElementsByTagNameNS('*', 'itemref')) {
    if (itemref.getAttribute('linear') === 'no') continue
    const entry = manifest.get(itemref.getAttribute('idref') ?? '')
    if (entry && /html/.test(entry.mediaType)) documents.push(entry.path)
  }
  return { documents, mediaTypes }
}

/** Resolves an href relative to a file in the zip (the OPF or a document) into a path inside the zip. */
function resolvePath(basePath: string, href: string): string {
  const url = new URL(href, `https://epub.local/${basePath}`)
  return decodeURIComponent(url.pathname.slice(1))
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

/**
 * Adds an image file to `images` the first time it's used, so a file used many
 * times is stored once. Returns false when the file isn't in the EPUB or isn't an image.
 */
function loadImage(path: string, files: Unzipped, mediaTypes: Map<string, string>, images: SourceBook['images']) {
  if (images.has(path)) return true
  const bytes = files[path]
  const mediaType = mediaTypes.get(path) || IMAGE_TYPES[path.split('.').pop()?.toLowerCase() ?? '']
  if (!bytes || !mediaType?.startsWith('image/')) return false
  images.set(path, new Blob([bytes.slice()], { type: mediaType }))
  return true
}

/** Pixel size of each image the browser can decode (SVGs often can't be, and are left out). */
async function measureImages(images: SourceBook['images']): Promise<Map<string, { width: number; height: number }>> {
  const sizes = new Map<string, { width: number; height: number }>()
  for (const [file, blob] of images) {
    try {
      const bitmap = await createImageBitmap(blob)
      sizes.set(file, { width: bitmap.width, height: bitmap.height })
      bitmap.close()
    } catch {
      // Unknown size: pagination treats it as a full-size image.
    }
  }
  return sizes
}

/** Descriptions that only repeat a file name or say "image" tell a screen reader user nothing. */
function usefulAlt(alt: string): string {
  const text = normalizeSpace(alt)
  if (/^(image|imagem|img|picture|figure|cover|capa)\s*\d*$/i.test(text)) return ''
  if (/^[\w\-. ]+\.(jpe?g|png|gif|svg|webp)$/i.test(text)) return ''
  return text
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const BLOCKS = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div, dd, dt, figcaption, td'
const IMAGES = 'img, image'
const XLINK_NS = 'http://www.w3.org/1999/xlink'

/**
 * The document's paragraphs and images, in reading order.
 * `addImage` registers an image file and says whether it could be used.
 */
function extractBlocks(html: string, documentPath: string, addImage: (path: string) => boolean): SourceBlock[] {
  const document = parseHtml(html)
  const body = document.body ?? document.documentElement

  // Line breaks inside a paragraph would otherwise glue words together.
  for (const br of [...body.querySelectorAll('br')]) br.replaceWith(' ')

  const blocks: SourceBlock[] = []
  const placed = new Set<Element>()

  function pushImage(element: Element) {
    if (placed.has(element)) return
    placed.add(element)
    const href = element.getAttribute('src') ?? element.getAttributeNS(XLINK_NS, 'href') ?? element.getAttribute('href')
    // Embedded (data:) images are rare; they're skipped for now.
    if (!href || href.startsWith('data:')) return
    const file = resolvePath(documentPath, href)
    if (!addImage(file)) return
    blocks.push({ type: 'image', file, alt: usefulAlt(element.getAttribute('alt') ?? '') })
  }

  function pushText(element: Element) {
    // Images inside a paragraph go just before it.
    for (const image of element.querySelectorAll(IMAGES)) pushImage(image)
    const text = normalizeSpace(element.textContent ?? '')
    if (text) blocks.push(text)
  }

  // Innermost blocks only, so nested blocks don't repeat their text. Both lists
  // come from one query, so they're already in document order.
  const items = [...body.querySelectorAll(`${BLOCKS}, ${IMAGES}`)]
  const isImage = (element: Element) => element.localName === 'img' || element.localName === 'image'
  const textBlocks = items.filter((element) => !isImage(element) && !element.querySelector(BLOCKS))

  if (textBlocks.length === 0) {
    pushText(body)
    return blocks
  }
  for (const element of items) {
    if (isImage(element)) pushImage(element)
    else if (!element.querySelector(BLOCKS)) pushText(element)
  }
  return blocks
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

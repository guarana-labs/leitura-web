import type { SourceBlock, SourceImage } from '@/lib/import/sourceBook'
import { countWords } from '@/utils/words'

/** An image on a page, placed before the paragraph at index `before` (or at the end when it equals the paragraph count). */
export interface PageImageRef {
  /** Key into `SourceBook.images`. */
  file: string
  alt: string
  before: number
}

/** A page: its paragraphs and the images between them. */
export interface Page {
  paragraphs: string[]
  images: PageImageRef[]
}

/** Paragraphs longer than this many pages' worth of words get split at sentence ends. */
const LONG_PARAGRAPH_FACTOR = 1.5

/** How many words a full-size image takes up when filling a page, so pages with images stay short. */
const IMAGE_WORDS = 150

/** An image this tall (in pixels, once fitted to the text column) or taller counts as full size. */
const FULL_IMAGE_HEIGHT = 300

/** Roughly the reader's text column width in pixels. */
const COLUMN_WIDTH = 560

/** Words an image takes up: in proportion to its height on screen, so a small ornament barely counts. */
function imageWords(image: SourceImage): number {
  if (!image.width || !image.height) return IMAGE_WORDS
  const shownHeight = image.height * Math.min(1, COLUMN_WIDTH / image.width)
  return Math.ceil(IMAGE_WORDS * Math.min(1, shownHeight / FULL_IMAGE_HEIGHT))
}

/** A paragraph right after an image this short is treated as its caption and kept on the same page. */
const CAPTION_MAX_WORDS = 60

/** Paginates each section separately, so every section starts on a new page. */
export function paginateSections(sections: SourceBlock[][], wordsPerPage: number): Page[] {
  return sections.flatMap((blocks) => paginate(blocks, wordsPerPage))
}

/**
 * Splits blocks into pages of about `wordsPerPage` words.
 * Paragraphs are never cut, except ones far longer than a page, which are split
 * at sentence boundaries so a single page never becomes huge. An image counts as
 * up to IMAGE_WORDS words depending on its size, and starts a new page together
 * with its caption when they don't fit on the current one.
 */
export function paginate(blocks: SourceBlock[], wordsPerPage: number): Page[] {
  const items = blocks.flatMap((block): SourceBlock[] =>
    typeof block === 'string' ? splitLongParagraph(block, wordsPerPage) : [block],
  )
  const pages: Page[] = []
  let current: Page = { paragraphs: [], images: [] }
  let currentWords = 0

  const isEmpty = (page: Page) => page.paragraphs.length === 0 && page.images.length === 0
  function startPageIfFull(words: number) {
    if (!isEmpty(current) && currentWords + words > wordsPerPage) {
      pages.push(current)
      current = { paragraphs: [], images: [] }
      currentWords = 0
    }
  }

  for (const [index, item] of items.entries()) {
    if (typeof item === 'string') {
      const words = countWords(item)
      startPageIfFull(words)
      current.paragraphs.push(item)
      currentWords += words
    } else {
      const words = imageWords(item)
      const next = items[index + 1]
      const captionWords = typeof next === 'string' ? countWords(next) : Infinity
      startPageIfFull(words + (captionWords <= CAPTION_MAX_WORDS ? captionWords : 0))
      current.images.push({ file: item.file, alt: item.alt, before: current.paragraphs.length })
      currentWords += words
    }
  }
  if (!isEmpty(current)) pages.push(current)

  return pages
}

function splitLongParagraph(paragraph: string, wordsPerPage: number): string[] {
  if (countWords(paragraph) <= wordsPerPage * LONG_PARAGRAPH_FACTOR) return [paragraph]

  // Split after sentence-ending punctuation followed by a space.
  const sentences = paragraph.match(/[^.!?…]+(?:[.!?…]+["»”’)]*\s*|$)/g) ?? [paragraph]
  const parts: string[] = []
  let part = ''
  for (const sentence of sentences) {
    if (part && countWords(part) + countWords(sentence) > wordsPerPage) {
      parts.push(part.trim())
      part = ''
    }
    part += sentence
  }
  if (part.trim()) parts.push(part.trim())
  return parts
}

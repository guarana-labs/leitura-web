import { countWords } from '@/utils/words'

/** A page is a list of paragraphs. */
export type Page = string[]

/** Paragraphs longer than this many pages' worth of words get split at sentence ends. */
const LONG_PARAGRAPH_FACTOR = 1.5

/**
 * Splits paragraphs into pages of about `wordsPerPage` words.
 * Paragraphs are never cut, except ones far longer than a page, which are split
 * at sentence boundaries so a single page never becomes huge.
 */
export function paginate(paragraphs: string[], wordsPerPage: number): Page[] {
  const pages: Page[] = []
  let current: Page = []
  let currentWords = 0

  for (const paragraph of paragraphs.flatMap((item) => splitLongParagraph(item, wordsPerPage))) {
    const words = countWords(paragraph)
    if (current.length > 0 && currentWords + words > wordsPerPage) {
      pages.push(current)
      current = []
      currentWords = 0
    }
    current.push(paragraph)
    currentWords += words
  }
  if (current.length > 0) pages.push(current)

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

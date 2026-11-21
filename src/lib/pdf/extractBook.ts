/**
 * Turns a PDF's text layer into a list of paragraphs.
 *
 * Deliberately simple heuristics (to be improved over time):
 * - Lines: text items sharing the same baseline.
 * - Headers/footers: lines that are only a page number, or that repeat at the
 *   top/bottom of many pages, are dropped.
 * - Paragraphs: a new paragraph starts after a larger vertical gap, an indented
 *   line, or a short previous line that ends a sentence.
 * - Hyphenation: "Wor-" + "ten" at a line break becomes "Worten".
 *
 * The book's structure (chapters, headings) is not detected: headings simply
 * become paragraphs of the text.
 *
 * This module has no React or browser dependencies, so it can be tested in isolation.
 */

import { NoTextError, type ProgressCallback } from '@/lib/import/sourceBook'

/** The subset of pdf.js' API this module needs. */
export interface PdfLike {
  numPages: number
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: unknown[] }>
  }>
}

export interface ExtractedBook {
  paragraphs: string[]
}

interface RawTextItem {
  str: string
  transform: number[]
  width: number
  height: number
  hasEOL?: boolean
}

interface Line {
  text: string
  x: number
  y: number
  endX: number
  height: number
  page: number
}

/** Minimum characters of text across the whole PDF; below this we assume a scanned PDF. */
const MIN_TEXT_CHARS = 200
const SAME_LINE_TOLERANCE = 2

export async function extractBook(pdf: PdfLike, onProgress?: ProgressCallback): Promise<ExtractedBook> {
  const pages: Line[][] = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    pages.push(buildLines(content.items as RawTextItem[], pageNumber))
    onProgress?.(pageNumber / pdf.numPages)
  }

  const allLines = pages.flat()
  const totalChars = allLines.reduce((sum, line) => sum + line.text.length, 0)
  // Almost no text usually means a scanned PDF (pages are images).
  if (totalChars < MIN_TEXT_CHARS) throw new NoTextError()

  const cleanedPages = removeHeadersAndFooters(pages)
  const layout = measureLayout(cleanedPages.flat())
  return { paragraphs: buildParagraphs(cleanedPages, layout) }
}

// ---------------------------------------------------------------------------
// Lines
// ---------------------------------------------------------------------------

function isTextItem(item: unknown): item is RawTextItem {
  return typeof item === 'object' && item !== null && 'str' in item && 'transform' in item
}

function buildLines(items: unknown[], page: number): Line[] {
  const lines: Line[] = []
  let current: Line | null = null

  for (const item of items) {
    if (!isTextItem(item)) continue
    const x = item.transform[4]
    const y = item.transform[5]

    const startsNewLine = current === null || Math.abs(current.y - y) > SAME_LINE_TOLERANCE
    if (startsNewLine) {
      if (current) lines.push(current)
      current = { text: '', x, y, endX: x, height: 0, page }
    }

    // `current` is always set here; the check keeps TypeScript happy.
    if (!current) continue
    if (item.str !== '') {
      if (current.text === '') current.x = x
      current.text += item.str
      current.endX = x + item.width
      current.height = Math.max(current.height, item.height)
    }
    if (item.hasEOL) {
      lines.push(current)
      current = null
    }
  }
  if (current) lines.push(current)

  return lines
    .map((line) => ({ ...line, text: line.text.replace(/\s+/g, ' ').trim() }))
    .filter((line) => line.text !== '')
}

// ---------------------------------------------------------------------------
// Headers and footers
// ---------------------------------------------------------------------------

const PAGE_NUMBER = /^[-–—\s]*(\d{1,4}|[ivxlcdm]{1,7})[-–—\s]*$/i

function removeHeadersAndFooters(pages: Line[][]): Line[][] {
  // Count how often each first/last line repeats (digits ignored, so "Chapter 3 · 45" matches "Chapter 3 · 46").
  const edgeCounts = new Map<string, number>()
  const edgeKey = (line: Line) => line.text.replace(/\d+/g, '#').toLowerCase()

  for (const lines of pages) {
    const edges = new Set([lines[0], lines[lines.length - 1]].filter(Boolean).map(edgeKey))
    for (const key of edges) edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1)
  }

  const repeatThreshold = Math.max(3, pages.length * 0.2)
  const isRepeatedEdge = (line: Line) => (edgeCounts.get(edgeKey(line)) ?? 0) >= repeatThreshold

  return pages.map((lines) =>
    lines.filter((line, index) => {
      if (PAGE_NUMBER.test(line.text)) return false
      const isEdge = index === 0 || index === lines.length - 1
      return !(isEdge && isRepeatedEdge(line))
    }),
  )
}

// ---------------------------------------------------------------------------
// Layout measurements
// ---------------------------------------------------------------------------

interface Layout {
  bodyHeight: number
  leftMargin: number
  rightEdge: number
  lineGap: number
}

function mostCommon(values: number[]): number {
  const counts = new Map<number, number>()
  let best = values[0] ?? 0
  let bestCount = 0
  for (const value of values) {
    const count = (counts.get(value) ?? 0) + 1
    counts.set(value, count)
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best
}

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]
}

function measureLayout(lines: Line[]): Layout {
  const bodyHeight = mostCommon(lines.map((line) => Math.round(line.height)))
  const bodyLines = lines.filter((line) => Math.round(line.height) === bodyHeight)

  const gaps: number[] = []
  for (let i = 1; i < bodyLines.length; i++) {
    const previous = bodyLines[i - 1]
    const line = bodyLines[i]
    if (previous.page === line.page) gaps.push(Math.round((previous.y - line.y) * 2) / 2)
  }

  return {
    bodyHeight,
    leftMargin: mostCommon(bodyLines.map((line) => Math.round(line.x))),
    rightEdge: percentile(bodyLines.map((line) => line.endX), 0.9),
    lineGap: mostCommon(gaps.filter((gap) => gap > 0)) || bodyHeight * 1.2,
  }
}

// ---------------------------------------------------------------------------
// Paragraphs
// ---------------------------------------------------------------------------

const SENTENCE_END = /[.!?…:»«"“”'’)]$/

function buildParagraphs(pages: Line[][], layout: Layout): string[] {
  const paragraphs: string[] = []
  let paragraph = ''
  let previous: Line | null = null

  for (const line of pages.flat()) {
    const continuesHyphenatedWord = isHyphenBreak(paragraph, line.text)
    if (previous && !continuesHyphenatedWord && startsNewParagraph(previous, line, layout)) {
      if (paragraph.trim()) paragraphs.push(paragraph.trim())
      paragraph = ''
    }
    paragraph = joinLines(paragraph, line.text)
    previous = line
  }
  if (paragraph.trim()) paragraphs.push(paragraph.trim())

  return paragraphs
}

function startsNewParagraph(previous: Line, line: Line, layout: Layout): boolean {
  const isIndented = line.x > layout.leftMargin + layout.bodyHeight * 0.5
  if (isIndented) return true

  if (previous.page === line.page && previous.y - line.y > layout.lineGap * 1.5) return true

  const previousIsShort = previous.endX < layout.rightEdge - layout.bodyHeight * 2
  return previousIsShort && SENTENCE_END.test(previous.text)
}

/**
 * A word hyphenated across a line or page break: "Wor-" followed by "ten".
 * Known limitation: a compound like "Nord- und" that happens to fall on a line
 * break is joined as "Nordund". Rare enough to accept for now.
 */
function isHyphenBreak(paragraph: string, next: string): boolean {
  return /[a-zà-ÿß]-$/i.test(paragraph) && /^[a-zà-ÿß]/.test(next)
}

function joinLines(paragraph: string, next: string): string {
  if (paragraph === '') return next
  if (isHyphenBreak(paragraph, next)) return paragraph.slice(0, -1) + next
  return `${paragraph} ${next}`
}

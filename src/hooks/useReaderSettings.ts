import { useCallback, useState } from 'react'
import { DEFAULT_READER_FONT, isReaderFontId, type ReaderFontId } from '@/lib/readerFonts'

/** Reader font sizes in pixels; the index is what gets stored. */
const READER_FONT_SIZES = [16, 18, 20, 22, 24] as const
const DEFAULT_FONT_SIZE_INDEX = 1

const FONT_SIZE_KEY = 'leitura-reader-font-size'
const FONT_KEY = 'leitura-reader-font'

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    // Storage unavailable (private mode): defaults apply.
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Not persisted, but still applied for this visit.
  }
}

function readStoredSizeIndex(): number {
  const raw = readStorage(FONT_SIZE_KEY)
  // Number(null) is 0, so a missing value must be checked before converting.
  const stored = raw === null ? Number.NaN : Number(raw)
  return Number.isInteger(stored) && stored >= 0 && stored < READER_FONT_SIZES.length
    ? stored
    : DEFAULT_FONT_SIZE_INDEX
}

function readStoredFont(): ReaderFontId {
  const stored = readStorage(FONT_KEY)
  return isReaderFontId(stored) ? stored : DEFAULT_READER_FONT
}

/** Per-browser reader preferences: font and font size. */
export function useReaderSettings() {
  const [fontSizeIndex, setFontSizeIndex] = useState(readStoredSizeIndex)
  const [font, setFontState] = useState<ReaderFontId>(readStoredFont)

  const changeFontSize = useCallback((delta: number) => {
    setFontSizeIndex((current) => {
      const next = Math.min(READER_FONT_SIZES.length - 1, Math.max(0, current + delta))
      writeStorage(FONT_SIZE_KEY, String(next))
      return next
    })
  }, [])

  const setFont = useCallback((next: ReaderFontId) => {
    setFontState(next)
    writeStorage(FONT_KEY, next)
  }, [])

  return {
    font,
    setFont,
    fontSize: READER_FONT_SIZES[fontSizeIndex],
    canDecrease: fontSizeIndex > 0,
    canIncrease: fontSizeIndex < READER_FONT_SIZES.length - 1,
    decreaseFontSize: () => changeFontSize(-1),
    increaseFontSize: () => changeFontSize(1),
  }
}

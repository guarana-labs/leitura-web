import { useCallback, useState } from 'react'

/** Reader font sizes in pixels; the index is what gets stored. */
export const READER_FONT_SIZES = [16, 18, 20, 22, 24] as const
const DEFAULT_FONT_SIZE_INDEX = 1
const STORAGE_KEY = 'leitura-reader-font-size'

function readStoredIndex(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // Number(null) is 0, so a missing value must be checked before converting.
    const stored = raw === null ? Number.NaN : Number(raw)
    if (Number.isInteger(stored) && stored >= 0 && stored < READER_FONT_SIZES.length) return stored
  } catch {
    // Storage unavailable (private mode): fall back to the default.
  }
  return DEFAULT_FONT_SIZE_INDEX
}

/** Per-browser reader preferences (just the font size for now). */
export function useReaderSettings() {
  const [fontSizeIndex, setFontSizeIndex] = useState(readStoredIndex)

  const changeFontSize = useCallback((delta: number) => {
    setFontSizeIndex((current) => {
      const next = Math.min(READER_FONT_SIZES.length - 1, Math.max(0, current + delta))
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // Not persisted, but still applied for this visit.
      }
      return next
    })
  }, [])

  return {
    fontSize: READER_FONT_SIZES[fontSizeIndex],
    canDecrease: fontSizeIndex > 0,
    canIncrease: fontSizeIndex < READER_FONT_SIZES.length - 1,
    decreaseFontSize: () => changeFontSize(-1),
    increaseFontSize: () => changeFontSize(1),
  }
}

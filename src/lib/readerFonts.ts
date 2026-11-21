// The browser only downloads a font file when text actually uses that font.
import '@fontsource-variable/literata'
import '@fontsource-variable/atkinson-hyperlegible-next'

/**
 * Fonts the reader can use. Names are proper names (never translated);
 * `hintKey` is a short UI-language description of what each is good for.
 */
export const READER_FONTS = [
  {
    id: 'sans',
    name: 'Geist',
    family: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
    hintKey: 'reader.fonts.sansHint',
  },
  {
    id: 'serif',
    name: 'Literata',
    family: "'Literata Variable', Georgia, ui-serif, serif",
    hintKey: 'reader.fonts.serifHint',
  },
  {
    id: 'legible',
    name: 'Atkinson Hyperlegible',
    family: "'Atkinson Hyperlegible Next Variable', ui-sans-serif, system-ui, sans-serif",
    hintKey: 'reader.fonts.legibleHint',
  },
] as const

export type ReaderFontId = (typeof READER_FONTS)[number]['id']

export const DEFAULT_READER_FONT: ReaderFontId = 'sans'

export function isReaderFontId(value: string | null): value is ReaderFontId {
  return READER_FONTS.some((font) => font.id === value)
}

export function readerFontFamily(id: ReaderFontId): string {
  return READER_FONTS.find((font) => font.id === id)?.family ?? READER_FONTS[0].family
}

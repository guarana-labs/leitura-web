/**
 * Colour themes for the reader only (the rest of the app keeps its light/dark theme).
 * Softer than pure black-on-white for long sessions. The palettes live in index.css
 * as `html.reader-<id>`; `swatch` / `ink` preview them in the menu.
 */
export const READER_THEMES = [
  { id: 'paper', swatch: '#fbf8f1', ink: '#2b2a27', isDark: false, labelKey: 'reader.themes.paper', hintKey: 'reader.themes.paperHint' },
  { id: 'sepia', swatch: '#f4ecd8', ink: '#433422', isDark: false, labelKey: 'reader.themes.sepia', hintKey: 'reader.themes.sepiaHint' },
  { id: 'night', swatch: '#1c1b19', ink: '#d6d2c9', isDark: true, labelKey: 'reader.themes.night', hintKey: 'reader.themes.nightHint' },
] as const

export type ReaderThemeId = (typeof READER_THEMES)[number]['id']

export function isReaderThemeId(value: string | null): value is ReaderThemeId {
  return READER_THEMES.some((theme) => theme.id === value)
}

export function isDarkReaderTheme(id: ReaderThemeId): boolean {
  return READER_THEMES.find((theme) => theme.id === id)?.isDark ?? false
}

/** Without a saved choice, match the app: light → paper, dark → night. */
export function defaultReaderTheme(appTheme: 'light' | 'dark'): ReaderThemeId {
  return appTheme === 'dark' ? 'night' : 'paper'
}

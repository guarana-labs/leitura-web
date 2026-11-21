import { useLayoutEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { READER_THEMES, isDarkReaderTheme, type ReaderThemeId } from '@/lib/readerThemes'

/**
 * Applies the reader theme to <html> while the reader is open, so portaled menus and the
 * side panel match too. Leaving the reader restores the app's own light/dark theme.
 */
export function useReaderThemeClass(readerTheme: ReaderThemeId) {
  const { theme: appTheme } = useTheme()

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.add(`reader-${readerTheme}`)
    // Keep Tailwind's `dark:` variants in line with the reader theme.
    root.classList.toggle('dark', isDarkReaderTheme(readerTheme))

    return () => {
      for (const theme of READER_THEMES) root.classList.remove(`reader-${theme.id}`)
      root.classList.toggle('dark', appTheme === 'dark')
    }
  }, [readerTheme, appTheme])
}

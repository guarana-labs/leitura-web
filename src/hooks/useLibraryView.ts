import { useCallback, useState } from 'react'

export type LibraryView = 'list' | 'grid'

const STORAGE_KEY = 'leitura-library-view'

function readStoredView(): LibraryView {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'grid' ? 'grid' : 'list'
  } catch {
    // Storage unavailable (private mode): default applies.
    return 'list'
  }
}

/** How the library shows books (list or grid), remembered per browser. */
export function useLibraryView() {
  const [view, setViewState] = useState<LibraryView>(readStoredView)

  const setView = useCallback((next: LibraryView) => {
    setViewState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not persisted, but still applied for this visit.
    }
  }, [])

  return { view, setView }
}

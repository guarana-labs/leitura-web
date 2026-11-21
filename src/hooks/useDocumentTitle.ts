import { useEffect } from 'react'

const APP_NAME = 'Leitura'

/** Sets the tab title to "<title> | Leitura" (or just "Leitura" without one), restoring it on unmount. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME
    return () => {
      document.title = APP_NAME
    }
  }, [title])
}

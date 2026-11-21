import { useCallback, useEffect, useState } from 'react'

// Older Safari (iPad) still only has the prefixed API.
type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}
type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

function isSupported(): boolean {
  const doc = document as WebkitDocument
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled)
}

function currentElement(): Element | null {
  const doc = document as WebkitDocument
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

/**
 * Browser fullscreen for the whole page (hides the address bar and system UI where allowed).
 * `isSupported` is false where sites can't go fullscreen, notably Safari on iPhone,
 * so callers can simply hide their button. Leaving the page exits fullscreen.
 */
export function useFullscreen() {
  const [supported] = useState(isSupported)
  const [isFullscreen, setIsFullscreen] = useState(() => currentElement() !== null)

  useEffect(() => {
    const update = () => setIsFullscreen(currentElement() !== null)
    document.addEventListener('fullscreenchange', update)
    document.addEventListener('webkitfullscreenchange', update)
    return () => {
      document.removeEventListener('fullscreenchange', update)
      document.removeEventListener('webkitfullscreenchange', update)
      if (currentElement()) void exit()
    }
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (currentElement()) {
        await exit()
      } else {
        const root = document.documentElement as WebkitElement
        if (root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' })
        else await root.webkitRequestFullscreen?.()
      }
    } catch {
      // Refused by the browser (e.g. no user gesture): nothing to do, the page stays as it is.
    }
  }, [])

  return { isSupported: supported, isFullscreen, toggle }
}

async function exit() {
  const doc = document as WebkitDocument
  if (doc.exitFullscreen) await doc.exitFullscreen()
  else await doc.webkitExitFullscreen?.()
}

import { useEffect, useMemo, useRef } from 'react'

/**
 * A temporary URL for a local file (blob), so it can be shown in an <img>.
 * The URL is released when the blob changes or the component unmounts.
 *
 * The release is delayed by a tick and cancelled if the same URL is used again:
 * in development, React's StrictMode unmounts and remounts every component once,
 * which would otherwise release a URL that's still on screen.
 */
export function useObjectUrl(blob: Blob | null): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  const pendingReleases = useRef(new Map<string, number>())

  useEffect(() => {
    if (!url) return
    const releases = pendingReleases.current
    window.clearTimeout(releases.get(url))
    releases.delete(url)
    return () => {
      releases.set(
        url,
        window.setTimeout(() => {
          URL.revokeObjectURL(url)
          releases.delete(url)
        }, 0),
      )
    }
  }, [url])

  return url
}

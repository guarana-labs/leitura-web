import { useEffect } from 'react'

/** ← / → turn pages, unless the user is typing or a dialog/panel is open. */
export function useKeyboardPaging(onPrevious: () => void, onNext: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onPrevious()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPrevious, onNext])
}

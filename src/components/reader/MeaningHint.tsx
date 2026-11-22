import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface MeaningHintProps {
  /** The hovered word's element, or null to hide the hint. */
  element: HTMLElement | null
  /** The user's own meaning for that word. */
  meaning: string
  onDismiss: () => void
}

/**
 * Small label above a hovered word showing the user's own meaning, so a forgotten
 * word can be recalled without opening the word box. One shared label for the
 * whole page (not one per word), placed at the word's position on screen.
 */
export function MeaningHint({ element, meaning, onDismiss }: MeaningHintProps) {
  // The label is fixed to the screen, so it would drift while scrolling: hide it instead.
  useEffect(() => {
    if (!element) return
    window.addEventListener('scroll', onDismiss, { passive: true, capture: true })
    return () => window.removeEventListener('scroll', onDismiss, { capture: true })
  }, [element, onDismiss])

  if (!element) return null
  // Read when shown: the label only appears while the mouse rests on this word.
  const rect = element.getBoundingClientRect()

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2.5 py-1.5 text-sm text-popover-foreground shadow-md"
      style={{ left: rect.left + rect.width / 2, top: rect.top - 6 }}
    >
      {meaning}
    </div>,
    document.body,
  )
}

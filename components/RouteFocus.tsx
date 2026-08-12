'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Move focus to the top of the page when the route changes.
 *
 * A client-side navigation replaces the document's contents without replacing
 * the document, so the browser never does what it does on a real page load: it
 * does not reset focus and it does not tell assistive technology that anything
 * happened. Focus stays on the link that was activated, that link unmounts, and
 * focus falls back to <body> — so a keyboard user tabs from the very top of the
 * document after every navigation, and a screen reader user is told nothing.
 *
 * Focusing the main region rather than the heading, because `main` is already
 * the right landmark to land in and the heading inside it is read on arrival
 * anyway. `tabIndex={-1}` makes it programmatically focusable without adding a
 * tab stop — the element is not interactive and never becomes so.
 *
 * Skipped on first paint: a fresh load already starts focus at the top, and
 * stealing it there would fight the browser's own restoration on back/forward.
 */
export function RouteFocus({ targetId }: { targetId: string }) {
  const pathname = usePathname()
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    document.getElementById(targetId)?.focus()
  }, [pathname, targetId])

  return null
}

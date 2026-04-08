import type { RefObject } from 'preact'
import { useEffect, useRef } from 'preact/hooks'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

/**
 * Traps focus within a container element and restores focus on deactivation.
 * When active, Tab/Shift+Tab cycle within the container's focusable elements.
 * When deactivated, focus returns to the element that was focused before activation.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Capture the previously focused element when trap activates
  useEffect(() => {
    if (!active) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
  }, [active])

  // Restore focus when trap deactivates
  useEffect(() => {
    if (active) return
    const prev = previousFocusRef.current
    if (prev && typeof prev.focus === 'function') {
      prev.focus()
      previousFocusRef.current = null
    }
  }, [active])

  // Trap Tab/Shift+Tab within the container
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusable = getFocusableElements(container)
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => container.removeEventListener('keydown', onKeyDown)
  }, [active])
}

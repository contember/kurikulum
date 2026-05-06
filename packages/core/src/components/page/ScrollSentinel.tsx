export interface ScrollSentinelProps {
  class?: string
}

/**
 * @deprecated Page.Root auto-renders the scroll sentinel inside `<main>`
 * whenever `completion === 'scroll'`, so this component is no longer
 * necessary. Kept exported as a no-op for backwards compatibility — remove
 * `<Page.ScrollSentinel />` from your layouts.
 */
export function ScrollSentinel(_props: ScrollSentinelProps = {}): null {
  return null
}

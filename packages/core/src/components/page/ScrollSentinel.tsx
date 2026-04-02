import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { PageContext } from './context.ts'

export interface ScrollSentinelProps {
  class?: string
}

export function ScrollSentinel({ class: className }: ScrollSentinelProps): VNode | null {
  const ctx = useContext(PageContext)
  if (!ctx) throw new Error('Page.ScrollSentinel must be used within Page.Root')

  if (ctx.completion !== 'scroll') return null

  return <div ref={ctx.sentinelRef} aria-hidden="true" class={className} />
}

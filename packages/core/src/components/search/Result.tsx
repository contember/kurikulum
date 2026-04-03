import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { SearchContext } from './context.ts'

export interface SearchResultProps {
  pageId: string
  class?: string
  children?: ComponentChildren
}

export function Result({ pageId, class: className, children }: SearchResultProps): VNode {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('Search.Result must be used within Search.Root')

  return (
    <div
      class={className}
      role="option"
      tabIndex={0}
      onClick={() => ctx.navigateTo(pageId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          ctx.navigateTo(pageId)
        }
      }}
    >
      {children}
    </div>
  )
}

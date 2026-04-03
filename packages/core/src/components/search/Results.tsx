import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { SearchContext } from './context.ts'

export interface SearchResultsProps {
  class?: string
  children?: ComponentChildren
}

export function Results({ class: className, children }: SearchResultsProps): VNode | null {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('Search.Results must be used within Search.Root')

  if (!ctx.isOpen) return null

  return (
    <div class={className} role="listbox" aria-label="Search results">
      {children ?? (
        ctx.results.length > 0
          ? ctx.results.map((r) => (
              <div
                key={r.pageId}
                role="option"
                tabIndex={0}
                onClick={() => ctx.navigateTo(r.pageId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    ctx.navigateTo(r.pageId)
                  }
                }}
              >
                <div>{r.title}</div>
                <div>{r.snippet}</div>
              </div>
            ))
          : ctx.query.trim()
            ? <div role="status">No results found</div>
            : null
      )}
    </div>
  )
}

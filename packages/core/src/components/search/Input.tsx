import type { VNode } from 'preact'
import { useCallback, useContext, useEffect, useRef } from 'preact/hooks'
import { SearchContext } from './context.ts'

export interface SearchInputProps {
  class?: string
  placeholder?: string
}

export function Input({ class: className, placeholder = 'Search...' }: SearchInputProps): VNode {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('Search.Input must be used within Search.Root')

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ctx.isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [ctx.isOpen])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const len = ctx.results.length
    if (len === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      ctx.setActiveIndex(ctx.activeIndex < len - 1 ? ctx.activeIndex + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      ctx.setActiveIndex(ctx.activeIndex > 0 ? ctx.activeIndex - 1 : len - 1)
    } else if (e.key === 'Enter' && ctx.activeIndex >= 0 && ctx.activeIndex < len) {
      e.preventDefault()
      ctx.navigateTo(ctx.results[ctx.activeIndex].pageId)
    }
  }, [ctx])

  return (
    <input
      ref={inputRef}
      type="search"
      class={className}
      placeholder={placeholder}
      value={ctx.query}
      onInput={(e) => ctx.setQuery((e.target as HTMLInputElement).value)}
      onKeyDown={onKeyDown}
      aria-label="Search course content"
      role="combobox"
      aria-expanded={ctx.results.length > 0}
      aria-controls="search-results-listbox"
      aria-activedescendant={ctx.activeIndex >= 0 ? `search-result-${ctx.activeIndex}` : undefined}
      aria-autocomplete="list"
    />
  )
}

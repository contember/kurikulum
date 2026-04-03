import type { VNode } from 'preact'
import { useContext, useRef, useEffect } from 'preact/hooks'
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

  return (
    <input
      ref={inputRef}
      type="search"
      class={className}
      placeholder={placeholder}
      value={ctx.query}
      onInput={(e) => ctx.setQuery((e.target as HTMLInputElement).value)}
      aria-label="Search course content"
      role="searchbox"
    />
  )
}

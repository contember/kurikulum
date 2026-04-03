import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { GlossaryContext } from './context.ts'

export interface GlossarySearchProps {
  class?: string
  placeholder?: string
}

export function Search({ class: className, placeholder = 'Search glossary…' }: GlossarySearchProps): VNode {
  const ctx = useContext(GlossaryContext)
  if (!ctx) throw new Error('Glossary.Search must be used within Glossary.Root')

  return (
    <input
      type="search"
      class={className}
      placeholder={placeholder}
      value={ctx.query}
      onInput={(e) => ctx.setQuery((e.target as HTMLInputElement).value)}
      aria-label="Search glossary"
    />
  )
}

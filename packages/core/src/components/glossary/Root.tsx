import type { ComponentChildren, VNode } from 'preact'
import { useState, useCallback, useMemo } from 'preact/hooks'
import { GlossaryContext } from './context.ts'
import type { GlossaryEntry } from './context.ts'

export interface GlossaryRootProps {
  entries: GlossaryEntry[]
  children?: ComponentChildren
}

function searchEntries(entries: GlossaryEntry[], query: string): GlossaryEntry[] {
  if (!query.trim()) return entries
  const q = query.toLowerCase()
  return entries.filter(
    (e) =>
      e.term.toLowerCase().includes(q) ||
      e.definition.toLowerCase().includes(q) ||
      (e.aliases ?? []).some((a) => a.toLowerCase().includes(q)),
  )
}

export function Root({ entries, children }: GlossaryRootProps): VNode {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const search = useCallback(
    (q: string): GlossaryEntry[] => searchEntries(entries, q),
    [entries],
  )

  const filtered = useMemo(() => searchEntries(entries, query), [entries, query])

  const ctxValue = useMemo(
    () => ({ entries, search, filtered, query, setQuery, isOpen, open, close, toggle }),
    [entries, search, filtered, query, isOpen, open, close, toggle],
  )

  return (
    <GlossaryContext.Provider value={ctxValue}>
      {children}
    </GlossaryContext.Provider>
  )
}

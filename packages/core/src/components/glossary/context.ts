import { createContext } from 'preact'

export interface GlossaryEntry {
  term: string
  definition: string
  aliases?: string[]
}

export interface GlossaryContextValue {
  entries: GlossaryEntry[]
  search: (query: string) => GlossaryEntry[]
  filtered: GlossaryEntry[]
  query: string
  setQuery: (query: string) => void
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const GlossaryContext = createContext<GlossaryContextValue | null>(null)

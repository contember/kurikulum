import { createContext } from 'preact'

export interface SearchEntry {
  pageId: string
  title: string
  content: string
  keywords?: string[]
}

export interface SearchResult {
  pageId: string
  title: string
  snippet: string
}

export interface SearchContextValue {
  query: string
  setQuery: (q: string) => void
  results: SearchResult[]
  isOpen: boolean
  open: () => void
  close: () => void
  navigateTo: (pageId: string) => void
}

export const SearchContext = createContext<SearchContextValue | null>(null)

import { useContext } from 'preact/hooks'
import { SearchContext } from '../components/search/context.ts'
import type { SearchContextValue } from '../components/search/context.ts'

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext)
  if (!ctx) {
    throw new Error('useSearch must be used within a Search.Root')
  }
  return ctx
}

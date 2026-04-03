import { Root } from './Root.tsx'
import { Input } from './Input.tsx'
import { Results } from './Results.tsx'
import { Result } from './Result.tsx'

export const Search = { Root, Input, Results, Result }
export { SearchContext } from './context.ts'
export type { SearchContextValue, SearchEntry, SearchResult } from './context.ts'
export { normalize, extractSnippet, searchEntries } from './search-engine.ts'

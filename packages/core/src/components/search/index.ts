import { Input } from './Input.tsx'
import { Result } from './Result.tsx'
import { Results } from './Results.tsx'
import { Root } from './Root.tsx'

export const Search = { Root, Input, Results, Result }
export { SearchContext } from './context.ts'
export type { SearchContextValue, SearchEntry, SearchResult } from './context.ts'
export { extractSnippet, normalize, searchEntries } from './search-engine.ts'

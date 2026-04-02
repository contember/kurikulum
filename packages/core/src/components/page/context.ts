import type { RefObject } from 'preact'
import { createContext } from 'preact'
import type { CompletionStrategy } from '../../types.ts'
import type { CompletableRegistry } from '../../completion.ts'

export interface PageContextValue {
  sentinelRef: RefObject<HTMLDivElement>
  id: string
  completion: CompletionStrategy
  registry: CompletableRegistry
}

export const PageContext = createContext<PageContextValue | null>(null)

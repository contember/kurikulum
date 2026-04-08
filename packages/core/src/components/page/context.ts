import type { RefObject } from 'preact'
import { createContext } from 'preact'
import type { CompletableRegistry } from '../../completion.ts'
import type { CompletionStrategy } from '../../types.ts'

export interface PageContextValue {
  sentinelRef: RefObject<HTMLDivElement>
  id: string
  completion: CompletionStrategy
  registry: CompletableRegistry
}

export const PageContext = createContext<PageContextValue | null>(null)

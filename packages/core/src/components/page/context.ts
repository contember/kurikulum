import type { RefObject } from 'preact'
import { createContext } from 'preact'
import type { CompletionStrategy } from '../../types.ts'

export interface PageContextValue {
  sentinelRef: RefObject<HTMLDivElement>
  id: string
  completion: CompletionStrategy
}

export const PageContext = createContext<PageContextValue | null>(null)

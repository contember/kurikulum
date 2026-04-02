import { createContext } from 'preact'
import type { CourseRuntime, CompletionStrategy } from './types.ts'

export interface CourseContextValue {
  runtime: CourseRuntime
  subscribe(listener: () => void): () => void
  defaultCompletion: CompletionStrategy
  pageCompletions?: Record<string, CompletionStrategy>
}

export const CourseContext = createContext<CourseContextValue | null>(null)

/**
 * Simple pub/sub notifier for state change subscriptions.
 * Used by CourseProvider to notify hooks when runtime state changes.
 */
export function createNotifier() {
  const listeners = new Set<() => void>()
  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    notify(): void {
      for (const listener of listeners) {
        listener()
      }
    },
  }
}

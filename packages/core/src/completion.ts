import type { CompletionStrategy } from './types.ts'
export type { CompletionStrategy }

/**
 * Resolves which completion strategy to use for a page.
 * Per-page strategy overrides global default; falls back to 'mount'.
 */
export function resolveCompletionStrategy(
  pageStrategy?: CompletionStrategy,
  defaultStrategy?: CompletionStrategy,
): CompletionStrategy {
  return pageStrategy ?? defaultStrategy ?? 'mount'
}

export interface CompletionHandler {
  start(): void
  stop(): void
}

export function createMountHandler(onComplete: () => void): CompletionHandler {
  return {
    start() {
      onComplete()
    },
    stop() {},
  }
}

export function createTimerHandler(seconds: number, onComplete: () => void): CompletionHandler {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    start() {
      timer = setTimeout(onComplete, seconds * 1000)
    },
    stop() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}

export function createManualHandler(): CompletionHandler {
  return {
    start() {},
    stop() {},
  }
}

export function createScrollHandler(
  sentinel: Element,
  onComplete: () => void,
): CompletionHandler {
  let observer: IntersectionObserver | null = null
  return {
    start() {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            onComplete()
            observer?.disconnect()
            observer = null
          }
        },
        { threshold: 1.0 },
      )
      observer.observe(sentinel)
    },
    stop() {
      observer?.disconnect()
      observer = null
    },
  }
}

/**
 * Registry tracking which completable IDs belong to which page.
 * Used by the interactive strategy to determine when all
 * interactive elements on a page have been completed.
 */
export class CompletableRegistry {
  private pageCompletables = new Map<string, Set<string>>()

  register(pageId: string, completableId: string): void {
    let set = this.pageCompletables.get(pageId)
    if (!set) {
      set = new Set()
      this.pageCompletables.set(pageId, set)
    }
    set.add(completableId)
  }

  unregister(pageId: string, completableId: string): void {
    this.pageCompletables.get(pageId)?.delete(completableId)
  }

  getCompletables(pageId: string): string[] {
    const set = this.pageCompletables.get(pageId)
    return set ? [...set] : []
  }

  isPageInteractiveComplete(pageId: string, completions: Record<string, boolean>): boolean {
    const set = this.pageCompletables.get(pageId)
    if (!set || set.size === 0) return false
    for (const id of set) {
      if (completions[id] !== true) return false
    }
    return true
  }
}

export function createInteractiveHandler(
  pageId: string,
  registry: CompletableRegistry,
  getCompletions: () => Record<string, boolean>,
  onComplete: () => void,
): CompletionHandler {
  return {
    start() {
      if (registry.isPageInteractiveComplete(pageId, getCompletions())) {
        onComplete()
      }
    },
    stop() {},
  }
}

export function createCompletionHandler(
  strategy: CompletionStrategy,
  onComplete: () => void,
  options?: {
    timerSeconds?: number
    sentinel?: Element
    pageId?: string
    registry?: CompletableRegistry
    getCompletions?: () => Record<string, boolean>
  },
): CompletionHandler {
  switch (strategy) {
    case 'mount':
      return createMountHandler(onComplete)
    case 'timer':
      return createTimerHandler(options?.timerSeconds ?? 5, onComplete)
    case 'scroll': {
      if (!options?.sentinel) {
        throw new Error('scroll strategy requires a sentinel element')
      }
      return createScrollHandler(options.sentinel, onComplete)
    }
    case 'manual':
      return createManualHandler()
    case 'interactive': {
      if (!options?.pageId || !options?.registry || !options?.getCompletions) {
        throw new Error('interactive strategy requires pageId, registry, and getCompletions')
      }
      return createInteractiveHandler(
        options.pageId,
        options.registry,
        options.getCompletions,
        onComplete,
      )
    }
  }
}

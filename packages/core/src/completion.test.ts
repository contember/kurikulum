import { describe, it, expect, beforeEach, mock } from 'bun:test'
import {
  resolveCompletionStrategy,
  createMountHandler,
  createTimerHandler,
  createManualHandler,
  createScrollHandler,
  createInteractiveHandler,
  createCompletionHandler,
  CompletableRegistry,
} from './completion.ts'

describe('resolveCompletionStrategy', () => {
  it('returns page strategy when provided', () => {
    expect(resolveCompletionStrategy('timer', 'mount')).toBe('timer')
  })

  it('falls back to default strategy when page strategy is undefined', () => {
    expect(resolveCompletionStrategy(undefined, 'scroll')).toBe('scroll')
  })

  it('falls back to mount when both are undefined', () => {
    expect(resolveCompletionStrategy(undefined, undefined)).toBe('mount')
  })

  it('returns page strategy even without default', () => {
    expect(resolveCompletionStrategy('manual')).toBe('manual')
  })
})

describe('createMountHandler', () => {
  it('calls onComplete immediately on start', () => {
    const onComplete = mock(() => {})
    const handler = createMountHandler(onComplete)
    expect(onComplete).not.toHaveBeenCalled()
    handler.start()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe('createTimerHandler', () => {
  it('calls onComplete after specified seconds', async () => {
    const onComplete = mock(() => {})
    const handler = createTimerHandler(0.05, onComplete)
    handler.start()
    expect(onComplete).not.toHaveBeenCalled()
    await new Promise((r) => setTimeout(r, 80))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not call onComplete if stopped before timer fires', async () => {
    const onComplete = mock(() => {})
    const handler = createTimerHandler(0.05, onComplete)
    handler.start()
    handler.stop()
    await new Promise((r) => setTimeout(r, 80))
    expect(onComplete).not.toHaveBeenCalled()
  })
})

describe('createManualHandler', () => {
  it('does not call anything on start', () => {
    const handler = createManualHandler()
    // Should not throw
    handler.start()
    handler.stop()
  })
})

describe('createScrollHandler', () => {
  let observedElements: Element[]
  let observerCallback: IntersectionObserverCallback
  let disconnected: boolean

  beforeEach(() => {
    observedElements = []
    disconnected = false

    // @ts-expect-error — mock IntersectionObserver for testing
    globalThis.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback, public options: IntersectionObserverInit) {
        observerCallback = callback
      }
      observe(el: Element) {
        observedElements.push(el)
      }
      disconnect() {
        disconnected = true
      }
    }
  })

  it('observes the sentinel element on start', () => {
    const sentinel = {} as Element
    const handler = createScrollHandler(sentinel, () => {})
    handler.start()
    expect(observedElements).toContain(sentinel)
  })

  it('calls onComplete when sentinel is intersecting', () => {
    const onComplete = mock(() => {})
    const sentinel = {} as Element
    const handler = createScrollHandler(sentinel, onComplete)
    handler.start()

    observerCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('disconnects observer after completion', () => {
    const sentinel = {} as Element
    const handler = createScrollHandler(sentinel, () => {})
    handler.start()

    observerCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(disconnected).toBe(true)
  })

  it('does not call onComplete when not intersecting', () => {
    const onComplete = mock(() => {})
    const sentinel = {} as Element
    const handler = createScrollHandler(sentinel, onComplete)
    handler.start()

    observerCallback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('disconnects on stop', () => {
    const sentinel = {} as Element
    const handler = createScrollHandler(sentinel, () => {})
    handler.start()
    handler.stop()
    expect(disconnected).toBe(true)
  })
})

describe('CompletableRegistry', () => {
  let registry: CompletableRegistry

  beforeEach(() => {
    registry = new CompletableRegistry()
  })

  it('registers completable IDs for a page', () => {
    registry.register('page-1', 'q1')
    registry.register('page-1', 'q2')
    expect(registry.getCompletables('page-1')).toEqual(expect.arrayContaining(['q1', 'q2']))
  })

  it('returns empty array for unknown page', () => {
    expect(registry.getCompletables('unknown')).toEqual([])
  })

  it('unregisters a completable ID', () => {
    registry.register('page-1', 'q1')
    registry.register('page-1', 'q2')
    registry.unregister('page-1', 'q1')
    expect(registry.getCompletables('page-1')).toEqual(['q2'])
  })

  it('reports page complete when all completables are true', () => {
    registry.register('page-1', 'q1')
    registry.register('page-1', 'q2')
    const completions = { q1: true, q2: true }
    expect(registry.isPageInteractiveComplete('page-1', completions)).toBe(true)
  })

  it('reports page incomplete when some completables are false', () => {
    registry.register('page-1', 'q1')
    registry.register('page-1', 'q2')
    const completions = { q1: true }
    expect(registry.isPageInteractiveComplete('page-1', completions)).toBe(false)
  })

  it('reports page incomplete when no completables registered', () => {
    expect(registry.isPageInteractiveComplete('page-1', {})).toBe(false)
  })
})

describe('createInteractiveHandler', () => {
  it('calls onComplete when all completables are done', () => {
    const registry = new CompletableRegistry()
    registry.register('page-1', 'q1')
    registry.register('page-1', 'q2')

    const onComplete = mock(() => {})
    const completions = { q1: true, q2: true }
    const handler = createInteractiveHandler('page-1', registry, () => completions, onComplete)
    handler.start()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not call onComplete when some completables are pending', () => {
    const registry = new CompletableRegistry()
    registry.register('page-1', 'q1')
    registry.register('page-1', 'q2')

    const onComplete = mock(() => {})
    const completions = { q1: true }
    const handler = createInteractiveHandler('page-1', registry, () => completions, onComplete)
    handler.start()
    expect(onComplete).not.toHaveBeenCalled()
  })
})

describe('createCompletionHandler factory', () => {
  it('creates mount handler', () => {
    const onComplete = mock(() => {})
    const handler = createCompletionHandler('mount', onComplete)
    handler.start()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('creates manual handler', () => {
    const handler = createCompletionHandler('manual', () => {})
    handler.start() // should not throw
  })

  it('throws for scroll without sentinel', () => {
    expect(() => createCompletionHandler('scroll', () => {})).toThrow('sentinel')
  })

  it('throws for interactive without required options', () => {
    expect(() => createCompletionHandler('interactive', () => {})).toThrow('interactive')
  })

  it('creates timer handler with default seconds', () => {
    const onComplete = mock(() => {})
    const handler = createCompletionHandler('timer', onComplete)
    // Should not throw, just creates handler
    handler.stop()
    expect(onComplete).not.toHaveBeenCalled()
  })
})

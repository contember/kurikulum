import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { describe, it, expect, beforeEach } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import type { CourseRuntime, CourseConfig, DeliveryAdapter } from '../types.ts'
import { createCourseRuntime } from '../runtime.ts'
import { CourseContext, createNotifier } from '../context.tsx'
import type { CourseContextValue } from '../context.tsx'
import { useCourse } from './useCourse.ts'
import { useNavigation } from './useNavigation.ts'
import { useCompletion } from './useCompletion.ts'
import { useAssessment } from './useAssessment.ts'
import { usePage } from './usePage.ts'

function createMockAdapter(): DeliveryAdapter & { committed: number; suspendData: string; location: string } {
  return {
    committed: 0,
    suspendData: '',
    location: '',
    async initialize() {},
    commit() { this.committed++ },
    setSuspendData(data: string) { this.suspendData = data },
    getSuspendData() { return this.suspendData || null },
    setScore() {},
    setStatus() {},
    setLocation(pageId: string) { this.location = pageId },
    getLocation() { return this.location || null },
    setSessionTime() {},
    recordInteraction() {},
    terminate() {},
  }
}

const config: CourseConfig = {
  title: 'Test Course',
  pages: ['page-1', 'page-2', 'page-3'],
  passThreshold: 0.7,
  defaultCompletion: 'manual',
}

function createTestContext(runtime: CourseRuntime): CourseContextValue & { notify: () => void } {
  const { subscribe, notify } = createNotifier()
  const pageConditions: Record<string, () => boolean> = {}
  return {
    runtime,
    adapter: createMockAdapter(),
    subscribe,
    notify,
    defaultCompletion: config.defaultCompletion ?? 'mount',
    pageConditions,
    getVisiblePages() {
      return runtime.state.pages.filter(id => {
        const cond = pageConditions[id]
        return cond ? cond() : true
      })
    },
  }
}

/**
 * Helper to capture hook result inside a Preact component.
 * Returns a getter for the last captured value.
 */
function renderHook<T>(hookFn: () => T, ctx: CourseContextValue): { get: () => T; container: HTMLElement } {
  let result: T
  const container = document.createElement('div')

  function TestComponent() {
    result = hookFn()
    return null
  }

  render(
    h(CourseContext.Provider, { value: ctx },
      h(TestComponent, null),
    ),
    container,
  )

  return {
    get: () => result!,
    container,
  }
}

describe('hooks — outside context', () => {
  it('useCourse throws outside CourseProvider', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() { useCourse(); return null }
      render(h(Bad, null), container)
    }).toThrow('useCourse must be used within a CourseProvider')
  })

  it('useNavigation throws outside CourseProvider', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() { useNavigation(); return null }
      render(h(Bad, null), container)
    }).toThrow('useNavigation must be used within a CourseProvider')
  })

  it('useCompletion throws outside CourseProvider', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() { useCompletion('x'); return null }
      render(h(Bad, null), container)
    }).toThrow('useCompletion must be used within a CourseProvider')
  })

  it('useAssessment throws outside CourseProvider', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() { useAssessment(); return null }
      render(h(Bad, null), container)
    }).toThrow('useAssessment must be used within a CourseProvider')
  })

  it('usePage throws outside CourseProvider', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() { usePage(); return null }
      render(h(Bad, null), container)
    }).toThrow('usePage must be used within a CourseProvider')
  })
})

describe('useCourse', () => {
  it('returns the runtime', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const { get } = renderHook(() => useCourse(), ctx)
    expect(get()).toBe(runtime)
  })
})

describe('useNavigation', () => {
  let adapter: ReturnType<typeof createMockAdapter>
  let runtime: CourseRuntime
  let ctx: ReturnType<typeof createTestContext>

  beforeEach(() => {
    adapter = createMockAdapter()
    runtime = createCourseRuntime(config, adapter)
    ctx = createTestContext(runtime)
  })

  it('returns initial navigation state', () => {
    const { get } = renderHook(() => useNavigation(), ctx)
    const nav = get()
    expect(nav.currentPage).toBe('page-1')
    expect(nav.pageIndex).toBe(0)
    expect(nav.totalPages).toBe(3)
    expect(nav.canGoNext).toBe(false) // page-1 not yet complete
    expect(nav.canGoPrev).toBe(false)
  })

  it('canGoNext is true when current page is complete', () => {
    runtime.markComplete('page-1')
    const { get } = renderHook(() => useNavigation(), ctx)
    expect(get().canGoNext).toBe(true)
  })

  it('navigates forward with next()', () => {
    runtime.markComplete('page-1')
    const { get, container } = renderHook(() => useNavigation(), ctx)
    get().next()
    ctx.notify()
    // Re-render to pick up state change
    render(null, container)
    runtime.markComplete('page-2')
    const { get: get2 } = renderHook(() => useNavigation(), ctx)
    const nav = get2()
    expect(nav.currentPage).toBe('page-2')
    expect(nav.pageIndex).toBe(1)
    expect(nav.canGoNext).toBe(true)
    expect(nav.canGoPrev).toBe(true)
  })

  it('navigates backward with prev()', () => {
    runtime.navigateTo('page-2')
    const { get } = renderHook(() => useNavigation(), ctx)
    get().prev()
    ctx.notify()
    const { get: get2 } = renderHook(() => useNavigation(), ctx)
    expect(get2().currentPage).toBe('page-1')
  })

  it('goTo navigates to specific page', () => {
    const { get } = renderHook(() => useNavigation(), ctx)
    get().goTo('page-3')
    ctx.notify()
    const { get: get2 } = renderHook(() => useNavigation(), ctx)
    const nav = get2()
    expect(nav.currentPage).toBe('page-3')
    expect(nav.canGoNext).toBe(false)
    expect(nav.canGoPrev).toBe(true)
  })
})

describe('useCompletion', () => {
  it('returns initial incomplete state', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const { get } = renderHook(() => useCompletion('page-1'), ctx)
    expect(get().isComplete).toBe(false)
  })

  it('marks complete and reflects state', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const { get } = renderHook(() => useCompletion('page-1'), ctx)
    get().markComplete()
    ctx.notify()
    const { get: get2 } = renderHook(() => useCompletion('page-1'), ctx)
    expect(get2().isComplete).toBe(true)
  })
})

describe('useAssessment', () => {
  it('returns initial assessment state', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const { get } = renderHook(() => useAssessment(), ctx)
    const a = get()
    expect(a.score).toBeNull()
    expect(a.maxScore).toBe(0)
    expect(a.passed).toBeNull()
    expect(a.attempts).toBe(0)
  })

  it('submits score and updates state', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const { get } = renderHook(() => useAssessment(), ctx)
    get().submit(8, 10)
    ctx.notify()
    const { get: get2 } = renderHook(() => useAssessment(), ctx)
    const a = get2()
    expect(a.score).toBe(8)
    expect(a.maxScore).toBe(10)
    expect(a.passed).toBe(true)
    expect(a.attempts).toBe(1)
  })
})

describe('usePage', () => {
  it('returns current page info', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const { get } = renderHook(() => usePage(), ctx)
    const page = get()
    expect(page.pageId).toBe('page-1')
    expect(page.completion).toBe('manual')
  })

  it('uses page-specific completion strategy when set', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    ctx.pageCompletions = { 'page-1': 'timer' }
    const { get } = renderHook(() => usePage(), ctx)
    expect(get().completion).toBe('timer')
  })

  it('reflects current page after navigation', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    runtime.navigateTo('page-3')
    const { get } = renderHook(() => usePage(), ctx)
    expect(get().pageId).toBe('page-3')
  })
})

describe('createNotifier', () => {
  it('notifies all subscribers', () => {
    const { subscribe, notify } = createNotifier()
    let count1 = 0
    let count2 = 0
    subscribe(() => { count1++ })
    subscribe(() => { count2++ })
    notify()
    expect(count1).toBe(1)
    expect(count2).toBe(1)
  })

  it('unsubscribe removes listener', () => {
    const { subscribe, notify } = createNotifier()
    let count = 0
    const unsub = subscribe(() => { count++ })
    notify()
    expect(count).toBe(1)
    unsub()
    notify()
    expect(count).toBe(1)
  })
})

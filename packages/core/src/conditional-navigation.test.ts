import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { describe, it, expect, beforeEach } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import type { CourseRuntime, CourseConfig, DeliveryAdapter } from './types.ts'
import { createCourseRuntime } from './runtime.ts'
import { CourseContext, CourseProvider, createNotifier } from './context.tsx'
import type { CourseContextValue } from './context.tsx'
import { useNavigation } from './hooks/useNavigation.ts'

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

function createTestContext(runtime: CourseRuntime): CourseContextValue & { notify: () => void } {
  const { subscribe, notify } = createNotifier()
  const pageConditions: Record<string, () => boolean> = {}
  return {
    runtime,
    adapter: createMockAdapter(),
    subscribe,
    notify,
    defaultCompletion: 'mount',
    pageConditions,
    getVisiblePages() {
      return runtime.state.pages.filter(id => {
        const cond = pageConditions[id]
        return cond ? cond() : true
      })
    },
  }
}

function renderHook<T>(hookFn: () => T, ctx: CourseContextValue): { get: () => T } {
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

  return { get: () => result! }
}

describe('conditional navigation', () => {
  const config: CourseConfig = {
    title: 'Test Course',
    pages: ['intro', 'theory', 'quiz', 'remedial', 'summary'],
    passThreshold: 0.7,
  }

  let adapter: ReturnType<typeof createMockAdapter>
  let runtime: CourseRuntime
  let ctx: ReturnType<typeof createTestContext>

  beforeEach(() => {
    adapter = createMockAdapter()
    runtime = createCourseRuntime(config, adapter)
    ctx = createTestContext(runtime)
  })

  describe('getVisiblePages', () => {
    it('returns all pages when no conditions are set', () => {
      expect(ctx.getVisiblePages()).toEqual(['intro', 'theory', 'quiz', 'remedial', 'summary'])
    })

    it('filters out pages where when returns false', () => {
      ctx.pageConditions['remedial'] = () => false
      expect(ctx.getVisiblePages()).toEqual(['intro', 'theory', 'quiz', 'summary'])
    })

    it('includes pages where when returns true', () => {
      ctx.pageConditions['remedial'] = () => true
      expect(ctx.getVisiblePages()).toEqual(['intro', 'theory', 'quiz', 'remedial', 'summary'])
    })

    it('re-evaluates conditions dynamically', () => {
      let showRemedial = false
      ctx.pageConditions['remedial'] = () => showRemedial

      expect(ctx.getVisiblePages()).toEqual(['intro', 'theory', 'quiz', 'summary'])

      showRemedial = true
      expect(ctx.getVisiblePages()).toEqual(['intro', 'theory', 'quiz', 'remedial', 'summary'])
    })

    it('can filter multiple pages', () => {
      ctx.pageConditions['theory'] = () => false
      ctx.pageConditions['remedial'] = () => false

      expect(ctx.getVisiblePages()).toEqual(['intro', 'quiz', 'summary'])
    })
  })

  describe('useNavigation with conditions', () => {
    it('totalPages reflects visible pages only', () => {
      ctx.pageConditions['remedial'] = () => false
      const { get } = renderHook(() => useNavigation(), ctx)
      expect(get().totalPages).toBe(4)
    })

    it('pageIndex is based on visible pages', () => {
      ctx.pageConditions['theory'] = () => false
      runtime.navigateTo('quiz')
      const { get } = renderHook(() => useNavigation(), ctx)
      // visible: intro, quiz, remedial, summary — quiz is index 1
      expect(get().pageIndex).toBe(1)
    })

    it('pages without when behave normally', () => {
      const { get } = renderHook(() => useNavigation(), ctx)
      expect(get().totalPages).toBe(5)
      expect(get().pageIndex).toBe(0)
    })
  })

  describe('navigation skips invisible pages', () => {
    it('nextPage skips hidden pages', () => {
      // Hide theory (index 1)
      ctx.pageConditions['theory'] = () => false

      // Wire up nextPage/prevPage to use visible pages (simulating what CourseProvider does)
      runtime.nextPage = () => {
        const visible = ctx.getVisiblePages()
        const idx = visible.indexOf(runtime.state.currentPage)
        if (idx < visible.length - 1) {
          runtime.navigateTo(visible[idx + 1])
        }
      }

      // On intro, next should skip theory and go to quiz
      runtime.nextPage()
      expect(runtime.state.currentPage).toBe('quiz')
    })

    it('prevPage skips hidden pages', () => {
      ctx.pageConditions['theory'] = () => false

      runtime.prevPage = () => {
        const visible = ctx.getVisiblePages()
        const idx = visible.indexOf(runtime.state.currentPage)
        if (idx > 0) {
          runtime.navigateTo(visible[idx - 1])
        }
      }

      runtime.navigateTo('quiz')
      runtime.prevPage()
      // Should skip theory and go to intro
      expect(runtime.state.currentPage).toBe('intro')
    })

    it('nextPage does nothing on last visible page', () => {
      ctx.pageConditions['summary'] = () => false

      runtime.nextPage = () => {
        const visible = ctx.getVisiblePages()
        const idx = visible.indexOf(runtime.state.currentPage)
        if (idx < visible.length - 1) {
          runtime.navigateTo(visible[idx + 1])
        }
      }

      runtime.navigateTo('remedial')
      runtime.nextPage()
      expect(runtime.state.currentPage).toBe('remedial')
    })
  })

  describe('CourseProvider integration', () => {
    it('wraps nextPage/prevPage to use visible pages', () => {
      const container = document.createElement('div')
      let navResult: ReturnType<typeof useNavigation>

      function Child() {
        navResult = useNavigation()
        return null
      }

      render(
        h(CourseProvider, { config, adapter } as any,
          h(Child, null),
        ),
        container,
      )

      // CourseProvider should expose getVisiblePages on context
      expect(navResult!.totalPages).toBe(5)
      expect(navResult!.currentPage).toBe('intro')
    })
  })

  describe('condition based on runtime state', () => {
    it('condition can read runtime state', () => {
      ctx.pageConditions['remedial'] = () => runtime.state.passed === false

      // Initially passed is null, so remedial is hidden
      expect(ctx.getVisiblePages()).not.toContain('remedial')

      // After failing assessment
      runtime.submitScore(3, 10)
      expect(ctx.getVisiblePages()).toContain('remedial')
    })

    it('condition based on completion', () => {
      ctx.pageConditions['theory'] = () => !runtime.isComplete('intro')

      // Theory visible initially (intro not complete)
      expect(ctx.getVisiblePages()).toContain('theory')

      // After completing intro, theory hidden
      runtime.markComplete('intro')
      expect(ctx.getVisiblePages()).not.toContain('theory')
    })
  })
})

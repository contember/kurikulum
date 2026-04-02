import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { h, options } from 'preact'
import { render } from 'preact'
import type { CourseConfig, DeliveryAdapter, CourseRuntime, SuspendEnvelope } from './types.ts'
import { CourseContext, CourseProvider, createNotifier } from './context.tsx'
import { useCourse } from './hooks/useCourse.ts'
import { CURRENT_SCHEMA_VERSION } from './runtime.ts'

/** Flush Preact's pending effects */
function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

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
    terminate() {},
  }
}

const config: CourseConfig = {
  title: 'Test Course',
  pages: ['page-1', 'page-2', 'page-3'],
  defaultCompletion: 'manual',
}

describe('CourseProvider', () => {
  it('initializes runtime and makes it available to hooks', () => {
    const adapter = createMockAdapter()
    let runtime: CourseRuntime | undefined
    function Child() {
      runtime = useCourse()
      return null
    }

    const container = document.createElement('div')
    render(
      h(CourseProvider, { config, adapter } as any,
        h(Child, null),
      ),
      container,
    )

    expect(runtime).toBeDefined()
    expect(runtime!.state.currentPage).toBe('page-1')
    expect(runtime!.state.pages).toEqual(['page-1', 'page-2', 'page-3'])
  })

  it('calls restore() on mount', () => {
    const adapter = createMockAdapter()
    // Pre-set suspend data to verify restore is called
    const envelope: SuspendEnvelope = {
      v: CURRENT_SCHEMA_VERSION,
      state: {
        currentPage: 'page-2',
        pages: ['page-1', 'page-2', 'page-3'],
        completions: { 'page-1': true },
        score: null,
        maxScore: 0,
        passed: null,
        attempts: 0,
        assessments: {},
        sessionStart: Date.now(),
        totalTimeMs: 5000,
      },
    }
    adapter.suspendData = JSON.stringify(envelope)

    let runtime: CourseRuntime | undefined
    function Child() {
      runtime = useCourse()
      return null
    }

    const container = document.createElement('div')
    render(
      h(CourseProvider, { config, adapter } as any,
        h(Child, null),
      ),
      container,
    )

    expect(runtime!.state.currentPage).toBe('page-2')
    expect(runtime!.state.completions['page-1']).toBe(true)
    expect(runtime!.state.totalTimeMs).toBe(5000)
  })

  it('calls suspend() on beforeunload', async () => {
    const adapter = createMockAdapter()
    let runtime: CourseRuntime | undefined
    function Child() {
      runtime = useCourse()
      return null
    }

    const container = document.createElement('div')
    render(
      h(CourseProvider, { config, adapter } as any,
        h(Child, null),
      ),
      container,
    )

    await flushEffects()

    // Trigger beforeunload
    const event = new Event('beforeunload')
    globalThis.dispatchEvent(event)

    expect(adapter.suspendData).toBeTruthy()
    const suspended = JSON.parse(adapter.suspendData) as SuspendEnvelope
    expect(suspended.v).toBe(CURRENT_SCHEMA_VERSION)
    expect(suspended.state.currentPage).toBe('page-1')
    expect(adapter.committed).toBeGreaterThan(0)
  })

  it('uses noop adapter when no adapter is provided', () => {
    let runtime: CourseRuntime | undefined
    function Child() {
      runtime = useCourse()
      return null
    }

    const container = document.createElement('div')
    render(
      h(CourseProvider, { config } as any,
        h(Child, null),
      ),
      container,
    )

    expect(runtime).toBeDefined()
    expect(runtime!.state.currentPage).toBe('page-1')
    // Should not throw when navigating without adapter
    expect(() => runtime!.navigateTo('page-2')).not.toThrow()
  })

  it('hooks throw outside provider', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() { useCourse(); return null }
      render(h(Bad, null), container)
    }).toThrow('useCourse must be used within a CourseProvider')
  })

  it('cleans up beforeunload listener on unmount', async () => {
    const adapter = createMockAdapter()
    function Child() {
      useCourse()
      return null
    }

    const container = document.createElement('div')
    render(
      h(CourseProvider, { config, adapter } as any,
        h(Child, null),
      ),
      container,
    )

    await flushEffects()

    // Unmount
    render(null, container)

    await flushEffects()

    // Reset adapter state
    adapter.suspendData = ''
    adapter.committed = 0

    // Trigger beforeunload after unmount — should NOT call suspend
    const event = new Event('beforeunload')
    globalThis.dispatchEvent(event)

    expect(adapter.suspendData).toBe('')
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

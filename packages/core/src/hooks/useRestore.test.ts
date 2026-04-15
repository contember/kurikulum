import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { beforeEach, describe, expect, it } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import { CourseContext, createNotifier } from '../context.tsx'
import type { CourseContextValue } from '../context.tsx'
import { createCourseRuntime, CURRENT_SCHEMA_VERSION } from '../runtime.ts'
import type { CourseConfig, CourseRuntime, DeliveryAdapter } from '../types.ts'
import { useRestore } from './useRestore.ts'
import type { RestoreContext } from './useRestore.ts'

function createMockAdapter(): DeliveryAdapter & { committed: number; suspendData: string; location: string } {
  return {
    committed: 0,
    suspendData: '',
    location: '',
    async initialize() {},
    commit() {
      this.committed++
    },
    setSuspendData(data: string) {
      this.suspendData = data
    },
    getSuspendData() {
      return this.suspendData || null
    },
    setScore() {},
    setStatus() {},
    setLocation(pageId: string) {
      this.location = pageId
    },
    getLocation() {
      return this.location || null
    },
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

function createTestContext(
  runtime: CourseRuntime,
  restoreInfo = { restored: false, storedPage: null as string | null },
): CourseContextValue & { notify: () => void } {
  const { subscribe, notify } = createNotifier()
  const pageConditions: Record<string, () => boolean> = {}
  let dismissed = false
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
    restoreInfo,
    get restoreDismissed() {
      return dismissed
    },
    set restoreDismissed(v: boolean) {
      dismissed = v
    },
    dismissRestore() {
      dismissed = true
      notify()
    },
  }
}

function captureHook<T>(renderFn: () => T): { result: T } {
  const ref = { result: null as unknown as T }
  function Capture() {
    ref.result = renderFn()
    return null
  }
  return ref
}

describe('useRestore', () => {
  let adapter: ReturnType<typeof createMockAdapter>
  let runtime: CourseRuntime
  let container: HTMLElement

  beforeEach(() => {
    adapter = createMockAdapter()
    runtime = createCourseRuntime(config, adapter)
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('returns hasStoredState=false when no stored state', () => {
    const ctx = createTestContext(runtime)
    let result: RestoreContext | null = null

    function Test() {
      result = useRestore()
      return null
    }

    render(h(CourseContext.Provider, { value: ctx }, h(Test, null)), container)
    expect(result!.hasStoredState).toBe(false)
    expect(result!.storedPage).toBeNull()
  })

  it('returns hasStoredState=true when stored state exists', () => {
    const ctx = createTestContext(runtime, { restored: true, storedPage: 'page-2' })
    let result: RestoreContext | null = null

    function Test() {
      result = useRestore()
      return null
    }

    render(h(CourseContext.Provider, { value: ctx }, h(Test, null)), container)
    expect(result!.hasStoredState).toBe(true)
    expect(result!.storedPage).toBe('page-2')
  })

  it('resume() dismisses the restore dialog', () => {
    const ctx = createTestContext(runtime, { restored: true, storedPage: 'page-2' })
    let result: RestoreContext | null = null

    function Test() {
      result = useRestore()
      return null
    }

    render(h(CourseContext.Provider, { value: ctx }, h(Test, null)), container)
    expect(result!.hasStoredState).toBe(true)

    result!.resume()

    // Re-render to pick up the change
    render(h(CourseContext.Provider, { value: ctx }, h(Test, null)), container)
    expect(result!.hasStoredState).toBe(false)
  })

  it('restart() resets state and dismisses dialog', () => {
    // First, set up stored state in runtime
    runtime.navigateTo('page-2')
    runtime.markComplete('page-1')
    runtime.submitScore(8, 10)

    const ctx = createTestContext(runtime, { restored: true, storedPage: 'page-2' })
    let result: RestoreContext | null = null

    function Test() {
      result = useRestore()
      return null
    }

    render(h(CourseContext.Provider, { value: ctx }, h(Test, null)), container)
    expect(result!.hasStoredState).toBe(true)

    result!.restart()

    // Verify state was reset
    expect(runtime.state.currentPage).toBe('page-1')
    expect(runtime.state.completions).toEqual({})
    expect(runtime.state.score).toBeNull()
    expect(runtime.state.assessments).toEqual({})

    // Re-render to pick up the change
    render(h(CourseContext.Provider, { value: ctx }, h(Test, null)), container)
    expect(result!.hasStoredState).toBe(false)
  })

  it('storedPage is null after dismiss', () => {
    const ctx = createTestContext(runtime, { restored: true, storedPage: 'page-2' })
    let result: RestoreContext | null = null

    function Test() {
      result = useRestore()
      return null
    }

    render(h(CourseContext.Provider, { value: ctx }, h(Test, null)), container)
    result!.resume()
    render(h(CourseContext.Provider, { value: ctx }, h(Test, null)), container)
    expect(result!.storedPage).toBeNull()
  })
})

describe('runtime.restore() returns RestoreInfo', () => {
  it('returns restored=false when no data', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const info = runtime.restore()
    expect(info.restored).toBe(false)
    expect(info.storedPage).toBeNull()
  })

  it('returns restored=true with storedPage when data exists', () => {
    const adapter = createMockAdapter()
    const runtime1 = createCourseRuntime(config, adapter)
    runtime1.navigateTo('page-2')
    runtime1.suspend()

    const runtime2 = createCourseRuntime(config, adapter)
    const info = runtime2.restore()
    expect(info.restored).toBe(true)
    expect(info.storedPage).toBe('page-2')
  })

  it('returns restored=false when suspended state has no meaningful progress', () => {
    const adapter = createMockAdapter()
    const runtime1 = createCourseRuntime(config, adapter)
    runtime1.suspend()

    const runtime2 = createCourseRuntime(config, adapter)
    const info = runtime2.restore()
    expect(info.restored).toBe(false)
    expect(info.storedPage).toBeNull()
  })

  it('returns restored=true when suspended state has a completion on first page', () => {
    const adapter = createMockAdapter()
    const runtime1 = createCourseRuntime(config, adapter)
    runtime1.markComplete('page-1')
    runtime1.suspend()

    const runtime2 = createCourseRuntime(config, adapter)
    const info = runtime2.restore()
    expect(info.restored).toBe(true)
    expect(info.storedPage).toBe('page-1')
  })

  it('returns restored=false for invalid JSON', () => {
    const adapter = createMockAdapter()
    adapter.suspendData = 'not-json'
    const runtime = createCourseRuntime(config, adapter)
    const info = runtime.restore()
    expect(info.restored).toBe(false)
  })

  it('returns restored=false for incompatible schema version', () => {
    const adapter = createMockAdapter()
    adapter.suspendData = JSON.stringify({ v: 999, state: {} })
    const runtime = createCourseRuntime(config, adapter)
    const info = runtime.restore()
    expect(info.restored).toBe(false)
  })
})

describe('runtime.reset()', () => {
  it('resets all state to initial values', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)

    // Modify state
    runtime.navigateTo('page-3')
    runtime.markComplete('page-1')
    runtime.markComplete('page-2')
    runtime.submitScore(8, 10)

    expect(runtime.state.currentPage).toBe('page-3')
    expect(runtime.state.completions['page-1']).toBe(true)
    expect(runtime.state.score).not.toBeNull()

    // Reset
    runtime.reset()

    expect(runtime.state.currentPage).toBe('page-1')
    expect(runtime.state.completions).toEqual({})
    expect(runtime.state.score).toBeNull()
    expect(runtime.state.maxScore).toBe(0)
    expect(runtime.state.passed).toBeNull()
    expect(runtime.state.attempts).toBe(0)
    expect(runtime.state.assessments).toEqual({})
    expect(runtime.state.totalTimeMs).toBe(0)
  })

  it('clears suspend data via adapter', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    runtime.navigateTo('page-2')
    runtime.suspend()

    expect(adapter.suspendData).not.toBe('')

    runtime.reset()
    expect(adapter.suspendData).toBe('')
  })
})

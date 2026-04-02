import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { createCourseRuntime } from './runtime.ts'
import type { CourseConfig, CourseRuntime, DeliveryAdapter } from './types.ts'

function createMockAdapter(): DeliveryAdapter & {
  committed: number
  suspendData: string
  location: string
} {
  return {
    committed: 0,
    suspendData: '',
    location: '',
    commit() {
      this.committed++
    },
    setSuspendData(data: string) {
      this.suspendData = data
    },
    getSuspendData() {
      return this.suspendData
    },
    setLocation(pageId: string) {
      this.location = pageId
    },
  }
}

const config: CourseConfig = {
  title: 'Test Course',
  pages: ['page-1', 'page-2', 'page-3'],
  passThreshold: 0.7,
}

describe('createCourseRuntime', () => {
  let adapter: ReturnType<typeof createMockAdapter>
  let runtime: CourseRuntime

  beforeEach(() => {
    adapter = createMockAdapter()
    runtime = createCourseRuntime(config, adapter)
  })

  describe('initial state', () => {
    it('sets currentPage to first page', () => {
      expect(runtime.state.currentPage).toBe('page-1')
    })

    it('copies pages from config', () => {
      expect(runtime.state.pages).toEqual(['page-1', 'page-2', 'page-3'])
    })

    it('starts with empty completions', () => {
      expect(runtime.state.completions).toEqual({})
    })

    it('starts with null score', () => {
      expect(runtime.state.score).toBeNull()
      expect(runtime.state.maxScore).toBe(0)
      expect(runtime.state.passed).toBeNull()
      expect(runtime.state.attempts).toBe(0)
    })
  })

  describe('navigation', () => {
    it('navigateTo sets currentPage', () => {
      runtime.navigateTo('page-2')
      expect(runtime.state.currentPage).toBe('page-2')
      expect(adapter.location).toBe('page-2')
    })

    it('navigateTo ignores invalid page', () => {
      runtime.navigateTo('nonexistent')
      expect(runtime.state.currentPage).toBe('page-1')
    })

    it('nextPage moves forward', () => {
      runtime.nextPage()
      expect(runtime.state.currentPage).toBe('page-2')
    })

    it('nextPage does nothing on last page', () => {
      runtime.navigateTo('page-3')
      runtime.nextPage()
      expect(runtime.state.currentPage).toBe('page-3')
    })

    it('prevPage moves backward', () => {
      runtime.navigateTo('page-2')
      runtime.prevPage()
      expect(runtime.state.currentPage).toBe('page-1')
    })

    it('prevPage does nothing on first page', () => {
      runtime.prevPage()
      expect(runtime.state.currentPage).toBe('page-1')
    })
  })

  describe('completion', () => {
    it('markComplete marks an id as complete', () => {
      runtime.markComplete('item-1')
      expect(runtime.isComplete('item-1')).toBe(true)
    })

    it('isComplete returns false for unknown id', () => {
      expect(runtime.isComplete('unknown')).toBe(false)
    })

    it('isPageComplete checks page completion', () => {
      expect(runtime.isPageComplete('page-1')).toBe(false)
      runtime.markComplete('page-1')
      expect(runtime.isPageComplete('page-1')).toBe(true)
    })
  })

  describe('assessment', () => {
    it('submitScore sets score and passed (passing)', () => {
      runtime.submitScore(8, 10)
      expect(runtime.state.score).toBe(8)
      expect(runtime.state.maxScore).toBe(10)
      expect(runtime.state.passed).toBe(true)
      expect(runtime.state.attempts).toBe(1)
    })

    it('submitScore sets passed to false when below threshold', () => {
      runtime.submitScore(5, 10)
      expect(runtime.state.passed).toBe(false)
    })

    it('submitScore uses custom threshold', () => {
      runtime.submitScore(5, 10, 0.5)
      expect(runtime.state.passed).toBe(true)
    })

    it('submitScore increments attempts', () => {
      runtime.submitScore(3, 10)
      runtime.submitScore(8, 10)
      expect(runtime.state.attempts).toBe(2)
    })
  })

  describe('suspend/restore', () => {
    it('roundtrips state through suspend and restore', () => {
      runtime.navigateTo('page-2')
      runtime.markComplete('page-1')
      runtime.submitScore(7, 10)

      runtime.suspend()

      // Create a new runtime and restore
      const adapter2 = createMockAdapter()
      adapter2.suspendData = adapter.suspendData
      const runtime2 = createCourseRuntime(config, adapter2)
      runtime2.restore()

      expect(runtime2.state.currentPage).toBe('page-2')
      expect(runtime2.state.completions['page-1']).toBe(true)
      expect(runtime2.state.score).toBe(7)
      expect(runtime2.state.maxScore).toBe(10)
      expect(runtime2.state.passed).toBe(true)
      expect(runtime2.state.attempts).toBe(1)
    })

    it('suspend calls adapter.commit()', () => {
      runtime.suspend()
      expect(adapter.committed).toBeGreaterThanOrEqual(1)
    })

    it('suspend serializes state to adapter', () => {
      runtime.suspend()
      expect(adapter.suspendData).toBeTruthy()
      const parsed = JSON.parse(adapter.suspendData)
      expect(parsed.currentPage).toBe('page-1')
    })

    it('restore does nothing when no suspend data', () => {
      const originalPage = runtime.state.currentPage
      runtime.restore()
      expect(runtime.state.currentPage).toBe(originalPage)
    })

    it('restore resets sessionStart', () => {
      runtime.suspend()
      const adapter2 = createMockAdapter()
      adapter2.suspendData = adapter.suspendData
      const runtime2 = createCourseRuntime(config, adapter2)
      const beforeRestore = Date.now()
      runtime2.restore()
      expect(runtime2.state.sessionStart).toBeGreaterThanOrEqual(beforeRestore)
    })
  })
})

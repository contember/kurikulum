import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { createCourseRuntime, CURRENT_SCHEMA_VERSION } from './runtime.ts'
import type { CourseConfig, CourseRuntime, DeliveryAdapter, AssessmentResult, SuspendEnvelope } from './types.ts'

function createMockAdapter(): DeliveryAdapter & {
  committed: number
  suspendData: string
  location: string
} {
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

    it('suspend serializes state as envelope to adapter', () => {
      runtime.suspend()
      expect(adapter.suspendData).toBeTruthy()
      const parsed = JSON.parse(adapter.suspendData) as SuspendEnvelope
      expect(parsed.v).toBe(CURRENT_SCHEMA_VERSION)
      expect(parsed.state.currentPage).toBe('page-1')
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

    it('roundtrips multi-assessment state through suspend and restore', () => {
      runtime.submitAssessmentScore('quiz-1', 8, 10, undefined, 0.3)
      runtime.submitAssessmentScore('quiz-2', 6, 10, undefined, 0.7)

      runtime.suspend()

      const adapter2 = createMockAdapter()
      adapter2.suspendData = adapter.suspendData
      const runtime2 = createCourseRuntime(config, adapter2)
      runtime2.restore()

      const q1 = runtime2.getAssessmentResult('quiz-1')!
      expect(q1.score).toBe(8)
      expect(q1.maxScore).toBe(10)
      expect(q1.weight).toBe(0.3)
      expect(q1.passed).toBe(true)

      const q2 = runtime2.getAssessmentResult('quiz-2')!
      expect(q2.score).toBe(6)
      expect(q2.maxScore).toBe(10)
      expect(q2.weight).toBe(0.7)
      expect(q2.passed).toBe(false)

      // Aggregate score should be recomputed from restored assessments
      expect(runtime2.state.score).not.toBeNull()
    })
  })

  describe('multi-assessment', () => {
    it('submitAssessmentScore tracks independent assessment results', () => {
      runtime.submitAssessmentScore('quiz-1', 8, 10)
      runtime.submitAssessmentScore('quiz-2', 6, 10)

      const q1 = runtime.getAssessmentResult('quiz-1')!
      expect(q1.score).toBe(8)
      expect(q1.maxScore).toBe(10)
      expect(q1.passed).toBe(true)
      expect(q1.attempts).toBe(1)

      const q2 = runtime.getAssessmentResult('quiz-2')!
      expect(q2.score).toBe(6)
      expect(q2.maxScore).toBe(10)
      expect(q2.passed).toBe(false)
      expect(q2.attempts).toBe(1)
    })

    it('getAssessmentResult returns null for unknown assessment', () => {
      expect(runtime.getAssessmentResult('nonexistent')).toBeNull()
    })

    it('submitAssessmentScore increments attempts on re-submit', () => {
      runtime.submitAssessmentScore('quiz-1', 5, 10)
      runtime.submitAssessmentScore('quiz-1', 8, 10)
      const q1 = runtime.getAssessmentResult('quiz-1')!
      expect(q1.attempts).toBe(2)
      expect(q1.score).toBe(8)
    })

    it('submitAssessmentScore accepts weight parameter', () => {
      runtime.submitAssessmentScore('quiz-1', 8, 10, undefined, 0.2)
      const q1 = runtime.getAssessmentResult('quiz-1')!
      expect(q1.weight).toBe(0.2)
    })

    it('submitAssessmentScore preserves existing weight on re-submit', () => {
      runtime.submitAssessmentScore('quiz-1', 5, 10, undefined, 0.3)
      runtime.submitAssessmentScore('quiz-1', 8, 10)
      const q1 = runtime.getAssessmentResult('quiz-1')!
      expect(q1.weight).toBe(0.3)
    })

    it('computes weighted aggregate score', () => {
      // quiz-1: score=8/10, weight=0.2
      // quiz-2: score=9/10, weight=0.8
      runtime.submitAssessmentScore('quiz-1', 8, 10, undefined, 0.2)
      runtime.submitAssessmentScore('quiz-2', 9, 10, undefined, 0.8)

      // Weighted avg score = (8*0.2 + 9*0.8) / (0.2+0.8) = 8.8
      expect(runtime.state.score).toBeCloseTo(8.8)
      // Weighted avg maxScore = (10*0.2 + 10*0.8) / (0.2+0.8) = 10
      expect(runtime.state.maxScore).toBeCloseTo(10)
    })

    it('aggregate passed requires all assessments to pass', () => {
      runtime.submitAssessmentScore('quiz-1', 8, 10) // passed
      runtime.submitAssessmentScore('quiz-2', 5, 10) // failed (0.5 < 0.7)

      expect(runtime.state.passed).toBe(false)

      // Now re-submit quiz-2 with passing score
      runtime.submitAssessmentScore('quiz-2', 8, 10)
      expect(runtime.state.passed).toBe(true)
    })

    it('aggregate attempts is max of all assessment attempts', () => {
      runtime.submitAssessmentScore('quiz-1', 5, 10)
      runtime.submitAssessmentScore('quiz-1', 8, 10)
      runtime.submitAssessmentScore('quiz-2', 9, 10)

      expect(runtime.state.attempts).toBe(2) // max(2, 1)
    })

    it('submitScore backward compat uses __default__ assessment', () => {
      runtime.submitScore(8, 10)

      const result = runtime.getAssessmentResult('__default__')!
      expect(result.score).toBe(8)
      expect(result.maxScore).toBe(10)
      expect(result.passed).toBe(true)

      // Global state should match
      expect(runtime.state.score).toBe(8)
      expect(runtime.state.maxScore).toBe(10)
      expect(runtime.state.passed).toBe(true)
      expect(runtime.state.attempts).toBe(1)
    })

    it('calls adapter.setScore and adapter.setStatus on assessment submit', () => {
      const scoreArgs: [number, number][] = []
      const statusArgs: string[] = []
      adapter.setScore = (score: number, max: number) => { scoreArgs.push([score, max]) }
      adapter.setStatus = (status: any) => { statusArgs.push(status) }

      runtime.submitAssessmentScore('quiz-1', 8, 10)

      expect(scoreArgs).toEqual([[8, 10]])
      expect(statusArgs).toEqual(['passed'])
    })

    it('reports aggregate score to adapter with multiple assessments', () => {
      const scoreArgs: [number, number][] = []
      adapter.setScore = (score: number, max: number) => { scoreArgs.push([score, max]) }

      runtime.submitAssessmentScore('quiz-1', 8, 10, undefined, 0.4)
      runtime.submitAssessmentScore('quiz-2', 6, 10, undefined, 0.6)

      // Last call should have aggregate: (8*0.4 + 6*0.6)/(0.4+0.6) = 6.8
      const lastScore = scoreArgs[scoreArgs.length - 1]
      expect(lastScore[0]).toBeCloseTo(6.8)
    })

    it('initial state has empty assessments', () => {
      expect(runtime.state.assessments).toEqual({})
    })
  })

  describe('suspend_data versioning', () => {
    it('suspend_data contains schema version and course version', () => {
      const vConfig: CourseConfig = { ...config, version: '1.0' }
      const rt = createCourseRuntime(vConfig, adapter)
      rt.suspend()
      const envelope = JSON.parse(adapter.suspendData) as SuspendEnvelope
      expect(envelope.v).toBe(CURRENT_SCHEMA_VERSION)
      expect(envelope.courseVersion).toBe('1.0')
      expect(envelope.state).toBeDefined()
    })

    it('suspend_data without version in config omits courseVersion', () => {
      runtime.suspend()
      const envelope = JSON.parse(adapter.suspendData) as SuspendEnvelope
      expect(envelope.v).toBe(CURRENT_SCHEMA_VERSION)
      expect(envelope.courseVersion).toBeUndefined()
    })

    it('restores normally when schema and course version match', () => {
      const vConfig: CourseConfig = { ...config, version: '1.0' }
      const rt1 = createCourseRuntime(vConfig, adapter)
      rt1.navigateTo('page-2')
      rt1.markComplete('page-1')
      rt1.suspend()

      const adapter2 = createMockAdapter()
      adapter2.suspendData = adapter.suspendData
      const rt2 = createCourseRuntime(vConfig, adapter2)
      rt2.restore()

      expect(rt2.state.currentPage).toBe('page-2')
      expect(rt2.state.completions['page-1']).toBe(true)
    })

    it('resets on incompatible schema version', () => {
      const envelope: SuspendEnvelope = {
        v: 999,
        courseVersion: '1.0',
        state: {
          currentPage: 'page-2',
          pages: ['page-1', 'page-2'],
          completions: { 'page-1': true },
          score: null,
          maxScore: 0,
          passed: null,
          attempts: 0,
          assessments: {},
          sessionStart: 0,
          totalTimeMs: 5000,
          notes: [],
        },
      }
      adapter.suspendData = JSON.stringify(envelope)
      const vConfig: CourseConfig = { ...config, version: '1.0' }
      const rt = createCourseRuntime(vConfig, adapter)
      rt.restore()

      // Should be reset — initial state
      expect(rt.state.currentPage).toBe('page-1')
      expect(rt.state.completions).toEqual({})
      expect(rt.state.totalTimeMs).toBe(0)
    })

    it('resets when course version changed and no onMigrate', () => {
      const envelope: SuspendEnvelope = {
        v: CURRENT_SCHEMA_VERSION,
        courseVersion: '1.0',
        state: {
          currentPage: 'page-2',
          pages: ['page-1', 'page-2'],
          completions: { 'page-1': true },
          score: null,
          maxScore: 0,
          passed: null,
          attempts: 0,
          assessments: {},
          sessionStart: 0,
          totalTimeMs: 5000,
          notes: [],
        },
      }
      adapter.suspendData = JSON.stringify(envelope)
      const vConfig: CourseConfig = { ...config, version: '2.0' }
      const rt = createCourseRuntime(vConfig, adapter)
      rt.restore()

      expect(rt.state.currentPage).toBe('page-1')
      expect(rt.state.completions).toEqual({})
    })

    it('calls onMigrate when course version changes', () => {
      const envelope: SuspendEnvelope = {
        v: CURRENT_SCHEMA_VERSION,
        courseVersion: '1.0',
        state: {
          currentPage: 'page-1',
          pages: ['page-1', 'page-2'],
          completions: { 'old-page': true },
          score: null,
          maxScore: 0,
          passed: null,
          attempts: 0,
          assessments: {},
          sessionStart: 0,
          totalTimeMs: 3000,
          notes: [],
        },
      }
      adapter.suspendData = JSON.stringify(envelope)

      const vConfig: CourseConfig = {
        ...config,
        version: '2.0',
        onMigrate(old, oldVersion) {
          expect(oldVersion).toBe('1.0')
          const completions = { ...old.completions }
          if (completions['old-page']) {
            completions['page-1'] = true
            delete completions['old-page']
          }
          return { ...old, completions }
        },
      }
      const rt = createCourseRuntime(vConfig, adapter)
      rt.restore()

      expect(rt.state.completions['page-1']).toBe(true)
      expect(rt.state.completions['old-page']).toBeUndefined()
      expect(rt.state.totalTimeMs).toBe(3000)
      // pages should come from config, not old state
      expect(rt.state.pages).toEqual(config.pages)
    })

    it('resets when onMigrate returns null', () => {
      const envelope: SuspendEnvelope = {
        v: CURRENT_SCHEMA_VERSION,
        courseVersion: '1.0',
        state: {
          currentPage: 'page-2',
          pages: ['page-1', 'page-2'],
          completions: { 'page-1': true },
          score: null,
          maxScore: 0,
          passed: null,
          attempts: 0,
          assessments: {},
          sessionStart: 0,
          totalTimeMs: 5000,
          notes: [],
        },
      }
      adapter.suspendData = JSON.stringify(envelope)

      const vConfig: CourseConfig = {
        ...config,
        version: '2.0',
        onMigrate: () => null,
      }
      const rt = createCourseRuntime(vConfig, adapter)
      rt.restore()

      expect(rt.state.currentPage).toBe('page-1')
      expect(rt.state.completions).toEqual({})
    })

    it('safely discards old suspend_data without envelope', () => {
      // Old format: raw CourseState without envelope wrapper
      adapter.suspendData = JSON.stringify({
        currentPage: 'page-2',
        pages: ['page-1', 'page-2'],
        completions: { 'page-1': true },
        score: null,
        maxScore: 0,
        passed: null,
        attempts: 0,
        assessments: {},
        sessionStart: 0,
        totalTimeMs: 5000,
      })
      const rt = createCourseRuntime(config, adapter)
      rt.restore()

      // Should be reset
      expect(rt.state.currentPage).toBe('page-1')
      expect(rt.state.completions).toEqual({})
    })

    it('safely handles corrupt suspend_data', () => {
      adapter.suspendData = 'not-valid-json{{'
      const rt = createCourseRuntime(config, adapter)
      // Should not throw
      rt.restore()
      expect(rt.state.currentPage).toBe('page-1')
    })

    it('backward compatible — no version in config works like before', () => {
      // Config without version
      const rt1 = createCourseRuntime(config, adapter)
      rt1.navigateTo('page-2')
      rt1.markComplete('page-1')
      rt1.suspend()

      const adapter2 = createMockAdapter()
      adapter2.suspendData = adapter.suspendData
      const rt2 = createCourseRuntime(config, adapter2)
      rt2.restore()

      expect(rt2.state.currentPage).toBe('page-2')
      expect(rt2.state.completions['page-1']).toBe(true)
    })
  })
})

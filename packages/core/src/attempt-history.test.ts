import { beforeEach, describe, expect, it } from 'bun:test'
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
  pages: ['page-1', 'page-2'],
  passThreshold: 0.7,
}

describe('attempt history', () => {
  let adapter: ReturnType<typeof createMockAdapter>
  let runtime: CourseRuntime

  beforeEach(() => {
    adapter = createMockAdapter()
    runtime = createCourseRuntime(config, adapter)
  })

  it('stores attempt record on submit', () => {
    runtime.submitAssessmentScore('quiz-1', 8, 10)
    const result = runtime.getAssessmentResult('quiz-1')!
    expect(result.history).toHaveLength(1)
    expect(result.history[0].score).toBe(8)
    expect(result.history[0].maxScore).toBe(10)
    expect(result.history[0].passed).toBe(true)
    expect(result.history[0].timestamp).toBeGreaterThan(0)
    expect(result.history[0].answers).toEqual({})
  })

  it('accumulates history on multiple submits', () => {
    runtime.submitAssessmentScore('quiz-1', 5, 10)
    runtime.submitAssessmentScore('quiz-1', 8, 10)
    runtime.submitAssessmentScore('quiz-1', 10, 10)

    const result = runtime.getAssessmentResult('quiz-1')!
    expect(result.history).toHaveLength(3)
    expect(result.history[0].score).toBe(5)
    expect(result.history[0].passed).toBe(false)
    expect(result.history[1].score).toBe(8)
    expect(result.history[1].passed).toBe(true)
    expect(result.history[2].score).toBe(10)
    expect(result.history[2].passed).toBe(true)
  })

  it('stores answers in attempt record', () => {
    const answers = {
      q1: { response: '2', correct: true, score: 1 },
      q2: { response: '0', correct: false, score: 0 },
    }
    runtime.submitAssessmentScore('quiz-1', 5, 10, undefined, undefined, answers)

    const result = runtime.getAssessmentResult('quiz-1')!
    expect(result.history[0].answers).toEqual(answers)
  })

  it('history survives suspend/restore', () => {
    runtime.submitAssessmentScore('quiz-1', 5, 10, undefined, undefined, {
      q1: { response: 'A', correct: false, score: 0 },
    })
    runtime.submitAssessmentScore('quiz-1', 8, 10, undefined, undefined, {
      q1: { response: 'B', correct: true, score: 1 },
    })

    runtime.suspend()

    const adapter2 = createMockAdapter()
    adapter2.suspendData = adapter.suspendData
    const runtime2 = createCourseRuntime(config, adapter2)
    runtime2.restore()

    const result = runtime2.getAssessmentResult('quiz-1')!
    expect(result.history).toHaveLength(2)
    expect(result.history[0].score).toBe(5)
    expect(result.history[0].answers.q1.response).toBe('A')
    expect(result.history[1].score).toBe(8)
    expect(result.history[1].answers.q1.response).toBe('B')
  })

  it('history timestamps increase over time', () => {
    runtime.submitAssessmentScore('quiz-1', 5, 10)
    const t1 = runtime.getAssessmentResult('quiz-1')!.history[0].timestamp

    runtime.submitAssessmentScore('quiz-1', 8, 10)
    const t2 = runtime.getAssessmentResult('quiz-1')!.history[1].timestamp

    expect(t2).toBeGreaterThanOrEqual(t1)
  })

  it('independent assessments have independent histories', () => {
    runtime.submitAssessmentScore('quiz-1', 5, 10)
    runtime.submitAssessmentScore('quiz-2', 9, 10)
    runtime.submitAssessmentScore('quiz-1', 8, 10)

    const q1 = runtime.getAssessmentResult('quiz-1')!
    const q2 = runtime.getAssessmentResult('quiz-2')!

    expect(q1.history).toHaveLength(2)
    expect(q2.history).toHaveLength(1)
  })

  it('initial assessment has empty history', () => {
    expect(runtime.getAssessmentResult('quiz-1')).toBeNull()
  })

  it('backward compat submitScore also stores history', () => {
    runtime.submitScore(8, 10)
    const result = runtime.getAssessmentResult('__default__')!
    expect(result.history).toHaveLength(1)
    expect(result.history[0].score).toBe(8)
  })
})

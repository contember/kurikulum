import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { beforeEach, describe, expect, it } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import { useContext } from 'preact/hooks'
import { AssessmentContext } from './components/assessment/context.ts'
import type { AssessmentContextValue } from './components/assessment/context.ts'
import { Assessment } from './components/assessment/index.ts'
import { FillBlankContext } from './components/fill-blank/context.ts'
import type { FillBlankContextValue } from './components/fill-blank/context.ts'
import { FillBlank } from './components/fill-blank/index.ts'
import { MatchingContext } from './components/matching/context.ts'
import type { MatchingContextValue } from './components/matching/context.ts'
import { Matching } from './components/matching/index.ts'
import { MCQContext } from './components/mcq/context.ts'
import type { MCQContextValue } from './components/mcq/context.ts'
import { MCQ } from './components/mcq/index.ts'
import { OrderingContext } from './components/ordering/context.ts'
import type { OrderingContextValue } from './components/ordering/context.ts'
import { Ordering } from './components/ordering/index.ts'
import { CourseProvider } from './context.tsx'
import type { CourseConfig, DeliveryAdapter } from './types.ts'

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

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
  pages: ['page-1'],
  defaultCompletion: 'manual',
}

describe('Assessment retry', () => {
  let adapter: ReturnType<typeof createMockAdapter>
  let container: HTMLElement

  beforeEach(() => {
    adapter = createMockAdapter()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('unlocks MCQ controls after retry', async () => {
    let assessmentCtx: AssessmentContextValue | null = null
    let mcqCtx: MCQContextValue | null = null

    function CaptureContexts() {
      assessmentCtx = useContext(AssessmentContext)
      mcqCtx = useContext(MCQContext)
      return null
    }

    render(
      h(
        CourseProvider,
        { config, adapter } as any,
        h(
          Assessment.Root,
          { id: 'test-quiz', passThreshold: 1.0, maxAttempts: 3 },
          h(
            MCQ.Root,
            { id: 'q1', 'aria-label': 'Question 1' },
            h(MCQ.Item, { correct: false }, h(MCQ.ItemLabel, null, 'Wrong')),
            h(MCQ.Item, { correct: true }, h(MCQ.ItemLabel, null, 'Right')),
            h(CaptureContexts, null),
          ),
        ),
      ),
      container,
    )
    await flushEffects()

    // Initially not submitted
    expect(assessmentCtx!.submitted).toBe(false)
    expect(mcqCtx!.submitted).toBe(false)

    // Select wrong answer (index 0) and submit
    mcqCtx!.select(0)
    await flushEffects()

    assessmentCtx!.submit()
    await flushEffects()

    // After submit, should be submitted
    expect(assessmentCtx!.submitted).toBe(true)
    expect(mcqCtx!.submitted).toBe(true)

    // Retry
    expect(assessmentCtx!.canRetry).toBe(true)
    assessmentCtx!.retry()
    await flushEffects()

    // After retry, should be unlocked
    expect(assessmentCtx!.submitted).toBe(false)
    expect(mcqCtx!.submitted).toBe(false)

    // Should be able to select again
    mcqCtx!.select(1)
    await flushEffects()
    expect(mcqCtx!.selected).toBe(1)
  })

  it('re-enables disabled inputs in the DOM after retry', async () => {
    let assessmentCtx: AssessmentContextValue | null = null
    let mcqCtx: MCQContextValue | null = null

    function CaptureContexts() {
      assessmentCtx = useContext(AssessmentContext)
      mcqCtx = useContext(MCQContext)
      return null
    }

    render(
      h(
        CourseProvider,
        { config, adapter } as any,
        h(
          Assessment.Root,
          { id: 'test-quiz-2', passThreshold: 1.0, maxAttempts: 3 },
          h(
            MCQ.Root,
            { id: 'q2', 'aria-label': 'Question 2' },
            h(MCQ.Item, { correct: false }, h(MCQ.Control, null), h(MCQ.ItemLabel, null, 'Wrong')),
            h(MCQ.Item, { correct: true }, h(MCQ.Control, null), h(MCQ.ItemLabel, null, 'Right')),
            h(CaptureContexts, null),
          ),
        ),
      ),
      container,
    )
    await flushEffects()

    // Check DOM: inputs should not be disabled
    const getInputs = () => Array.from(container.getElementsByTagName('input')) as HTMLInputElement[]
    expect(getInputs()[0].disabled).toBe(false)
    expect(getInputs()[1].disabled).toBe(false)

    // Select wrong + submit
    mcqCtx!.select(0)
    await flushEffects()
    assessmentCtx!.submit()
    await flushEffects()

    // DOM: inputs should be disabled
    expect(getInputs()[0].disabled).toBe(true)
    expect(getInputs()[1].disabled).toBe(true)

    // Retry
    assessmentCtx!.retry()
    await flushEffects()

    // DOM: inputs should be re-enabled
    expect(getInputs()[0].disabled).toBe(false)
    expect(getInputs()[1].disabled).toBe(false)
  })

  it('unlocks FillBlank input after retry', async () => {
    let assessmentCtx: AssessmentContextValue | null = null
    let fbCtx: FillBlankContextValue | null = null

    function Capture() {
      assessmentCtx = useContext(AssessmentContext)
      fbCtx = useContext(FillBlankContext)
      return null
    }

    render(
      h(
        CourseProvider,
        { config, adapter } as any,
        h(
          Assessment.Root,
          { id: 'fb-quiz', passThreshold: 1.0, maxAttempts: 3 },
          h(FillBlank.Root, { id: 'fb1', accept: 'correct' }, h(FillBlank.Input, null), h(Capture, null)),
        ),
      ),
      container,
    )
    await flushEffects()

    const getInput = () => container.getElementsByTagName('input')[0] as HTMLInputElement

    // Initially enabled
    expect(getInput().disabled).toBe(false)

    // Type wrong answer + submit
    fbCtx!.setValue('wrong')
    await flushEffects()
    assessmentCtx!.submit()
    await flushEffects()

    // Should be disabled
    expect(getInput().disabled).toBe(true)
    expect(fbCtx!.submitted).toBe(true)

    // Retry
    assessmentCtx!.retry()
    await flushEffects()

    // Should be unlocked
    expect(getInput().disabled).toBe(false)
    expect(fbCtx!.submitted).toBe(false)
    // Value should be reset
    expect(fbCtx!.value).toBe('')
  })

  it('unlocks Matching selects after retry', async () => {
    let assessmentCtx: AssessmentContextValue | null = null
    let matchCtx: MatchingContextValue | null = null

    function Capture() {
      assessmentCtx = useContext(AssessmentContext)
      matchCtx = useContext(MatchingContext)
      return null
    }

    // Note: happy-dom can't render <select>/<option>, so test context only
    render(
      h(
        CourseProvider,
        { config, adapter } as any,
        h(
          Assessment.Root,
          { id: 'match-quiz', passThreshold: 1.0, maxAttempts: 3 },
          h(
            Matching.Root,
            { id: 'm1' },
            h(Matching.Pair, { prompt: 'A', response: 'X' }),
            h(Matching.Pair, { prompt: 'B', response: 'Y' }),
            h(Capture, null),
          ),
        ),
      ),
      container,
    )
    await flushEffects()

    // Initially not submitted
    expect(matchCtx!.submitted).toBe(false)

    // Select wrong answers + submit
    matchCtx!.select(0, 'Y')
    matchCtx!.select(1, 'X')
    await flushEffects()
    assessmentCtx!.submit()
    await flushEffects()

    // Should be submitted
    expect(matchCtx!.submitted).toBe(true)

    // Retry
    assessmentCtx!.retry()
    await flushEffects()

    // Should be unlocked
    expect(matchCtx!.submitted).toBe(false)
    // Selections should be reset
    expect(matchCtx!.selections.size).toBe(0)
  })

  it('unlocks Ordering buttons after retry', async () => {
    let assessmentCtx: AssessmentContextValue | null = null
    let orderCtx: OrderingContextValue | null = null

    function Capture() {
      assessmentCtx = useContext(AssessmentContext)
      orderCtx = useContext(OrderingContext)
      return null
    }

    render(
      h(
        CourseProvider,
        { config, adapter } as any,
        h(
          Assessment.Root,
          { id: 'order-quiz', passThreshold: 1.0, maxAttempts: 3 },
          h(
            Ordering.Root,
            { id: 'o1' },
            h(Ordering.Item, { order: 0 }, 'First'),
            h(Ordering.Item, { order: 1 }, 'Second'),
            h(Ordering.Item, { order: 2 }, 'Third'),
            h(Capture, null),
          ),
        ),
      ),
      container,
    )
    await flushEffects()

    // Initially not submitted
    expect(orderCtx!.submitted).toBe(false)

    // Submit (will be wrong since items are shuffled)
    assessmentCtx!.submit()
    await flushEffects()

    // Should be submitted
    expect(orderCtx!.submitted).toBe(true)

    // Retry
    assessmentCtx!.retry()
    await flushEffects()

    // Should be unlocked
    expect(orderCtx!.submitted).toBe(false)
  })
})

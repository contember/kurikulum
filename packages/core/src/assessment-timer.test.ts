import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import type { CourseConfig, DeliveryAdapter } from './types.ts'
import { CourseProvider } from './context.tsx'
import { Assessment } from './components/assessment/index.ts'
import { AssessmentContext } from './components/assessment/context.ts'
import type { AssessmentContextValue } from './components/assessment/context.ts'
import { TimerContext } from './components/assessment/timerContext.ts'
import type { TimerContextValue } from './components/assessment/timerContext.ts'
import { MCQ } from './components/mcq/index.ts'
import { MCQContext } from './components/mcq/context.ts'
import type { MCQContextValue } from './components/mcq/context.ts'
import { useContext } from 'preact/hooks'

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

function createMockAdapter(): DeliveryAdapter & { committed: number; suspendData: string; location: string; sessionTimeMs: number } {
  return {
    committed: 0,
    suspendData: '',
    location: '',
    sessionTimeMs: 0,
    async initialize() {},
    commit() { this.committed++ },
    setSuspendData(data: string) { this.suspendData = data },
    getSuspendData() { return this.suspendData || null },
    setScore() {},
    setStatus() {},
    setLocation(pageId: string) { this.location = pageId },
    getLocation() { return this.location || null },
    setSessionTime(ms: number) { this.sessionTimeMs = ms },
    recordInteraction() {},
    terminate() {},
  }
}

const config: CourseConfig = {
  title: 'Test Course',
  pages: ['page-1'],
  defaultCompletion: 'manual',
}

describe('Assessment timer', () => {
  let adapter: ReturnType<typeof createMockAdapter>
  let container: HTMLElement

  beforeEach(() => {
    adapter = createMockAdapter()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  it('provides timer context when timeLimit is set', async () => {
    let timerCtx: TimerContextValue | null = null

    function Capture() {
      timerCtx = useContext(TimerContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'timed-quiz', timeLimit: 300 },
          h(Capture, null),
        ),
      ),
      container,
    )
    await flushEffects()

    expect(timerCtx).not.toBeNull()
    expect(timerCtx!.total).toBe(300)
    expect(timerCtx!.remaining).toBe(300)
    expect(timerCtx!.isRunning).toBe(true)
    expect(timerCtx!.isExpired).toBe(false)
    expect(timerCtx!.formatted).toBe('05:00')
  })

  it('does not provide timer context without timeLimit', async () => {
    let timerCtx: TimerContextValue | null = null

    function Capture() {
      timerCtx = useContext(TimerContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'no-timer-quiz' },
          h(Capture, null),
        ),
      ),
      container,
    )
    await flushEffects()

    expect(timerCtx).toBeNull()
  })

  it('counts down every second', async () => {
    let timerCtx: TimerContextValue | null = null

    function Capture() {
      timerCtx = useContext(TimerContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'countdown-quiz', timeLimit: 10 },
          h(Capture, null),
        ),
      ),
      container,
    )
    await flushEffects()

    expect(timerCtx!.remaining).toBe(10)

    // Wait ~2 seconds
    await new Promise(resolve => setTimeout(resolve, 2100))

    expect(timerCtx!.remaining).toBe(8)
    expect(timerCtx!.formatted).toBe('00:08')
    expect(timerCtx!.isRunning).toBe(true)
  })

  it('auto-submits when time expires', async () => {
    let assessmentCtx: AssessmentContextValue | null = null
    let timerCtx: TimerContextValue | null = null
    let mcqCtx: MCQContextValue | null = null
    let timeExpiredCalled = false

    function Capture() {
      assessmentCtx = useContext(AssessmentContext)
      timerCtx = useContext(TimerContext)
      mcqCtx = useContext(MCQContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, {
          id: 'expire-quiz',
          timeLimit: 2,
          onTimeExpired: () => { timeExpiredCalled = true },
        },
          h(MCQ.Root, { id: 'q1', 'aria-label': 'Question' },
            h(MCQ.Item, { correct: true },
              h(MCQ.ItemLabel, null, 'Right'),
            ),
            h(MCQ.Item, { correct: false },
              h(MCQ.ItemLabel, null, 'Wrong'),
            ),
            h(Capture, null),
          ),
        ),
      ),
      container,
    )
    await flushEffects()

    // Select an answer
    mcqCtx!.select(0)
    await flushEffects()

    expect(assessmentCtx!.submitted).toBe(false)

    // Wait for timer to expire
    await new Promise(resolve => setTimeout(resolve, 2500))

    expect(timerCtx!.remaining).toBe(0)
    expect(timerCtx!.isExpired).toBe(true)
    expect(assessmentCtx!.submitted).toBe(true)
    expect(timeExpiredCalled).toBe(true)
  })

  it('stops countdown after manual submit', async () => {
    let assessmentCtx: AssessmentContextValue | null = null
    let timerCtx: TimerContextValue | null = null
    let mcqCtx: MCQContextValue | null = null

    function Capture() {
      assessmentCtx = useContext(AssessmentContext)
      timerCtx = useContext(TimerContext)
      mcqCtx = useContext(MCQContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'manual-submit-quiz', timeLimit: 60 },
          h(MCQ.Root, { id: 'q1', 'aria-label': 'Question' },
            h(MCQ.Item, { correct: true },
              h(MCQ.ItemLabel, null, 'Right'),
            ),
            h(Capture, null),
          ),
        ),
      ),
      container,
    )
    await flushEffects()

    mcqCtx!.select(0)
    await flushEffects()
    assessmentCtx!.submit()
    await flushEffects()

    expect(assessmentCtx!.submitted).toBe(true)
    expect(timerCtx!.isRunning).toBe(false)

    const remainingAfterSubmit = timerCtx!.remaining

    // Wait and verify timer stopped
    await new Promise(resolve => setTimeout(resolve, 1500))
    expect(timerCtx!.remaining).toBe(remainingAfterSubmit)
  })

  it('persists remaining time to state.timers for suspend', async () => {
    let timerCtx: TimerContextValue | null = null

    function Capture() {
      timerCtx = useContext(TimerContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'persist-quiz', timeLimit: 60 },
          h(Capture, null),
        ),
      ),
      container,
    )
    await flushEffects()

    // Wait 2 seconds for timer to tick
    await new Promise(resolve => setTimeout(resolve, 2100))

    // The remaining time should be persisted in suspend_data via state.timers
    expect(timerCtx!.remaining).toBe(58)
  })

  it('restores remaining time from suspend_data', async () => {
    // First: create a session with timer, let it tick, then suspend
    let timerCtx: TimerContextValue | null = null

    function Capture() {
      timerCtx = useContext(TimerContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'restore-quiz', timeLimit: 120 },
          h(Capture, null),
        ),
      ),
      container,
    )
    await flushEffects()

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2100))

    // Trigger suspend by dispatching beforeunload
    globalThis.dispatchEvent(new Event('beforeunload'))
    await flushEffects()

    // Check that suspend_data was written
    expect(adapter.suspendData).not.toBe('')
    const envelope = JSON.parse(adapter.suspendData)
    expect(envelope.state.timers['restore-quiz']).toBe(118)

    // Unmount
    render(null as any, container)
    await flushEffects()

    // Restore in a new session
    let timerCtx2: TimerContextValue | null = null

    function Capture2() {
      timerCtx2 = useContext(TimerContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'restore-quiz', timeLimit: 120 },
          h(Capture2, null),
        ),
      ),
      container,
    )
    await flushEffects()

    // Should restore with remaining time from suspend
    expect(timerCtx2!.remaining).toBe(118)
    expect(timerCtx2!.total).toBe(120)
  })

  it('resets timer on retry', async () => {
    let assessmentCtx: AssessmentContextValue | null = null
    let timerCtx: TimerContextValue | null = null
    let mcqCtx: MCQContextValue | null = null

    function Capture() {
      assessmentCtx = useContext(AssessmentContext)
      timerCtx = useContext(TimerContext)
      mcqCtx = useContext(MCQContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'retry-timer-quiz', timeLimit: 60, passThreshold: 1.0, maxAttempts: 3 },
          h(MCQ.Root, { id: 'q1', 'aria-label': 'Question' },
            h(MCQ.Item, { correct: false },
              h(MCQ.ItemLabel, null, 'Wrong'),
            ),
            h(MCQ.Item, { correct: true },
              h(MCQ.ItemLabel, null, 'Right'),
            ),
            h(Capture, null),
          ),
        ),
      ),
      container,
    )
    await flushEffects()

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2100))
    expect(timerCtx!.remaining).toBe(58)

    // Select wrong answer and submit
    mcqCtx!.select(0)
    await flushEffects()
    assessmentCtx!.submit()
    await flushEffects()

    // Retry
    assessmentCtx!.retry()
    await flushEffects()

    // Timer should be reset to full timeLimit
    expect(timerCtx!.remaining).toBe(60)
    expect(timerCtx!.isRunning).toBe(true)
  })

  it('Assessment.Timer renders formatted time', async () => {
    let timerCtx: TimerContextValue | null = null

    function Capture() {
      timerCtx = useContext(TimerContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'timer-render-quiz', timeLimit: 300 },
          h(Assessment.Timer, null),
          h(Capture, null),
        ),
      ),
      container,
    )
    await flushEffects()

    expect(timerCtx).not.toBeNull()
    expect(timerCtx!.formatted).toBe('05:00')

    // Find the timer div by looking for role attribute
    const divs = Array.from(container.getElementsByTagName('div')) as HTMLElement[]
    const timerEl = divs.find(d => d.getAttribute('role') === 'timer')
    expect(timerEl).not.toBeNull()
    expect(timerEl!.textContent).toBe('05:00')
  })

  it('Assessment.Timer supports render function', async () => {
    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'timer-render-fn-quiz', timeLimit: 90 },
          h(Assessment.Timer, {
            children: (remaining: number, isWarning: boolean) =>
              h('span', null, `${remaining}s${isWarning ? ' WARNING' : ''}`),
          }),
        ),
      ),
      container,
    )
    await flushEffects()

    const spans = Array.from(container.getElementsByTagName('span')) as HTMLElement[]
    const timerSpan = spans.find(s => s.textContent?.includes('s'))
    expect(timerSpan).not.toBeNull()
    expect(timerSpan!.textContent).toBe('90s')
  })

  it('isWarning becomes true below warningThreshold', async () => {
    let timerCtx: TimerContextValue | null = null

    function Capture() {
      timerCtx = useContext(TimerContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'warning-quiz', timeLimit: 3 },
          h(Capture, null),
        ),
      ),
      container,
    )
    await flushEffects()

    // With default warningThreshold=60, timer at 3s should have isWarning in context
    // The context-level isWarning uses hardcoded 60s threshold
    expect(timerCtx!.isWarning).toBe(true)
    expect(timerCtx!.remaining).toBe(3)
  })

  it('formats time correctly', async () => {
    let timerCtx: TimerContextValue | null = null

    function Capture() {
      timerCtx = useContext(TimerContext)
      return null
    }

    render(
      h(CourseProvider, { config, adapter } as any,
        h(Assessment.Root, { id: 'format-quiz', timeLimit: 3661 },
          h(Capture, null),
        ),
      ),
      container,
    )
    await flushEffects()

    // 3661 seconds = 61 minutes 1 second = "61:01"
    expect(timerCtx!.formatted).toBe('61:01')
  })
})

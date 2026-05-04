import { Window as HappyWindow } from 'happy-dom'

const window = new HappyWindow({ url: 'http://localhost' })
globalThis.document = window.document as unknown as Document

// happy-dom + Bun: Window object is missing error constructors (SyntaxError, TypeError, Error)
// which causes crashes in SelectorParser when using <select> elements.
if (!window.SyntaxError) (window as any).SyntaxError = globalThis.SyntaxError
if (!window.TypeError) (window as any).TypeError = globalThis.TypeError
if (!window.Error) (window as any).Error = globalThis.Error

globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(private callback: IntersectionObserverCallback, private options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

import { describe, expect, it } from 'bun:test'
import type { CourseConfig, CourseRuntime, DeliveryAdapter } from 'kurikulum'
import { CourseContext, createCourseRuntime, createNotifier, Matching as M } from 'kurikulum'
import type { CourseContextValue } from 'kurikulum'
import { h } from 'preact'
import { render } from 'preact'
import { Assessment } from '../../template/src/components/Assessment.tsx'
import { Matching, MatchingPair } from '../../template/src/components/Matching.tsx'
import { QuestionFeedback } from '../../template/src/components/QuestionFeedback.tsx'

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

function getSlots(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-matching-slot]'))
}

function getResponseChips(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-response]'))
}

function assignToSlot(container: HTMLElement, rerender: () => void, response: string, slotIndex: number) {
  const chip = container.querySelector<HTMLElement>(`[data-response="${response}"]`)
  if (!chip) throw new Error(`Response chip "${response}" not found`)
  chip.click()
  rerender() // flush state so slot sees selectedResponse
  const slot = getSlots(container)[slotIndex]
  if (!slot) throw new Error(`Slot ${slotIndex} not found`)
  slot.click()
}

function createMockAdapter(): DeliveryAdapter & { committed: number } {
  return {
    committed: 0,
    async initialize() {},
    commit() {
      this.committed++
    },
    setSuspendData() {},
    getSuspendData() {
      return null
    },
    setScore() {},
    setStatus() {},
    setLocation() {},
    getLocation() {
      return null
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
  passThreshold: 0.7,
}

function createTestContext(runtime: CourseRuntime): CourseContextValue & { notify: () => void } {
  const { subscribe, notify } = createNotifier()

  const originalSubmitScore = runtime.submitScore.bind(runtime)
  const originalMarkComplete = runtime.markComplete.bind(runtime)
  runtime.submitScore = (score: number, max: number, threshold?: number) => {
    originalSubmitScore(score, max, threshold)
    notify()
  }
  runtime.markComplete = (id: string) => {
    originalMarkComplete(id)
    notify()
  }

  return {
    runtime,
    adapter: createMockAdapter(),
    subscribe,
    notify,
    defaultCompletion: config.defaultCompletion ?? 'mount',
    pageConditions: {},
    getVisiblePages: () => [],
    restoreInfo: { restored: false, storedPage: null },
    restoreDismissed: false,
    dismissRestore() {
      notify()
    },
  }
}

function renderWithContext(
  ctx: CourseContextValue,
  makeTree: () => any,
) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  function App() {
    return h(CourseContext.Provider, { value: ctx } as any, makeTree())
  }
  render(h(App, null), container)
  return { container, rerender: () => render(h(App, null), container) }
}

describe('Matching', () => {
  it('renders prompts and drop slots', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(
      ctx,
      () =>
        h(
          Matching,
          { id: 'q1', question: 'Match the items:' },
          h(MatchingPair, { prompt: 'A', response: '1' }),
          h(MatchingPair, { prompt: 'B', response: '2' }),
        ),
    )

    await flushEffects()

    expect(container.textContent).toContain('Match the items:')

    const slots = getSlots(container)
    expect(slots.length).toBe(2)

    const chips = getResponseChips(container)
    expect(chips.length).toBe(2)
  })

  it('responses are available as chips', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(
      ctx,
      () =>
        h(
          Matching,
          { id: 'q1', question: 'Match:' },
          h(MatchingPair, { prompt: 'XSS', response: 'Script injection' }),
          h(MatchingPair, { prompt: 'CSRF', response: 'Session abuse' }),
          h(MatchingPair, { prompt: 'SQLi', response: 'DB manipulation' }),
        ),
    )

    await flushEffects()

    const slots = getSlots(container)
    expect(slots.length).toBe(3)

    const chips = getResponseChips(container)
    expect(chips.length).toBe(3)

    const chipValues = new Set(chips.map(c => c.getAttribute('data-response')))
    expect(chipValues.has('Script injection')).toBe(true)
    expect(chipValues.has('Session abuse')).toBe(true)
    expect(chipValues.has('DB manipulation')).toBe(true)
  })

  it('evaluates all correct as score 1', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Matching,
          { id: 'q1', question: 'Match:' },
          h(MatchingPair, { prompt: 'A', response: '1' }),
          h(MatchingPair, { prompt: 'B', response: '2' }),
        ),
    )

    await flushEffects()

    assignToSlot(container, rerender, '1', 0)
    rerender()
    assignToSlot(container, rerender, '2', 1)
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('true')
  })

  it('evaluates partial correct with partial credit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Matching,
          { id: 'q1', question: 'Match:' },
          h(MatchingPair, { prompt: 'A', response: '1' }),
          h(MatchingPair, { prompt: 'B', response: '2' }),
        ),
    )

    await flushEffects()

    // Assign wrong: '2' → slot 0 (A), '1' → slot 1 (B)
    assignToSlot(container, rerender, '2', 0)
    rerender()
    assignToSlot(container, rerender, '1', 1)
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('false')
    expect(fieldset.getAttribute('data-submitted')).toBe('true')
  })

  it('data-correct on individual slots after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          M.Root,
          { id: 'q1', 'aria-label': 'Match:' },
          h(M.Pair, { prompt: 'A', response: '1' }),
          h(M.Pair, { prompt: 'B', response: '2' }),
          h(M.Slot, { pairIndex: 0 }),
          h(M.Slot, { pairIndex: 1 }),
          h(M.ResponseChip, { response: '1' }),
          h(M.ResponseChip, { response: '2' }),
          h(M.Submit, null, 'Submit'),
        ),
    )

    await flushEffects()

    // Assign '2' to slot 0 (wrong for A) and '1' to slot 1 (wrong for B)
    assignToSlot(container, rerender, '2', 0)
    rerender()
    assignToSlot(container, rerender, '1', 1)
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const slots = getSlots(container)
    // slot 0 has '2' (correct is '1') → false
    expect(slots[0].getAttribute('data-correct')).toBe('false')
    // slot 1 has '1' (correct is '2') → false
    expect(slots[1].getAttribute('data-correct')).toBe('false')
  })

  it('hides response chips after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Matching,
          { id: 'q1', question: 'Match:' },
          h(MatchingPair, { prompt: 'A', response: '1' }),
          h(MatchingPair, { prompt: 'B', response: '2' }),
        ),
    )

    await flushEffects()

    assignToSlot(container, rerender, '1', 0)
    rerender()
    assignToSlot(container, rerender, '2', 1)
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    // Unplaced chip pool should be empty after submit
    const chips = getResponseChips(container)
    expect(chips.length).toBe(0)
    // Submit button should be hidden
    expect(container.getElementsByTagName('button').length).toBe(0)
  })

  it('submit button disabled when not all pairs selected', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(
      ctx,
      () =>
        h(
          Matching,
          { id: 'q1', question: 'Match:' },
          h(MatchingPair, { prompt: 'A', response: '1' }),
          h(MatchingPair, { prompt: 'B', response: '2' }),
        ),
    )

    await flushEffects()

    const button = container.getElementsByTagName('button')[0]
    expect(button.disabled).toBe(true)
  })

  it('works within Assessment', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(
            Matching,
            { id: 'q1', question: 'Match:' },
            h(MatchingPair, { prompt: 'A', response: '1' }),
            h(MatchingPair, { prompt: 'B', response: '2' }),
          ),
        ),
    )

    await flushEffects()

    assignToSlot(container, rerender, '1', 0)
    rerender()
    assignToSlot(container, rerender, '2', 1)
    rerender()

    // Click Assessment submit
    const buttons = container.getElementsByTagName('button')
    let submitBtn: HTMLButtonElement | null = null
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent?.includes('Submit')) {
        submitBtn = buttons[i] as HTMLButtonElement
        break
      }
    }
    expect(submitBtn).not.toBeNull()
    submitBtn!.click()
    rerender()
    await flushEffects()

    expect(runtime.state.score).toBe(1)
    expect(runtime.state.maxScore).toBe(1)
    expect(runtime.state.passed).toBe(true)
  })

  it('resets on assessment retry', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5, maxAttempts: 3 },
          h(
            Matching,
            { id: 'q1', question: 'Match:' },
            h(MatchingPair, { prompt: 'A', response: '1' }),
            h(MatchingPair, { prompt: 'B', response: '2' }),
          ),
        ),
    )

    await flushEffects()

    // Assign wrong answers and submit
    assignToSlot(container, rerender, '2', 0)
    rerender()
    assignToSlot(container, rerender, '1', 1)
    rerender()

    const buttons = container.getElementsByTagName('button')
    let submitBtn: HTMLButtonElement | null = null
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent?.includes('Submit')) {
        submitBtn = buttons[i] as HTMLButtonElement
        break
      }
    }
    submitBtn!.click()
    rerender()
    await flushEffects()

    // Click retry
    const allButtons = container.getElementsByTagName('button')
    let retryBtn: HTMLButtonElement | null = null
    for (let i = 0; i < allButtons.length; i++) {
      if (allButtons[i].textContent?.includes('Try again')) {
        retryBtn = allButtons[i] as HTMLButtonElement
        break
      }
    }
    expect(retryBtn).not.toBeNull()
    retryBtn!.click()
    rerender()
    await flushEffects()

    // Slots should be empty and response chips should reappear
    const slots = getSlots(container)
    for (const slot of slots) {
      expect(slot.getAttribute('data-has-selection')).toBeNull()
    }
    const chips = getResponseChips(container)
    expect(chips.length).toBe(2)
  })

  it('marks interactive completion on submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () => h(Matching, { id: 'q1', question: 'Match:' }, h(MatchingPair, { prompt: 'A', response: '1' })),
    )

    await flushEffects()

    expect(runtime.isComplete('q1')).toBe(false)

    assignToSlot(container, rerender, '1', 0)
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    expect(runtime.isComplete('q1')).toBe(true)
  })

  it('shows feedback via QuestionFeedback', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Matching,
          { id: 'q1', question: 'Match:' },
          h(MatchingPair, { prompt: 'A', response: '1' }),
          h(QuestionFeedback, { correct: 'All correct!', incorrect: 'Try again!' }),
        ),
    )

    await flushEffects()

    // No feedback initially
    expect(container.textContent).not.toContain('All correct!')
    expect(container.textContent).not.toContain('Try again!')

    assignToSlot(container, rerender, '1', 0)
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    expect(container.textContent).toContain('All correct!')
  })

  it('prompt displays text from pair definition', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(
      ctx,
      () =>
        h(
          M.Root,
          { id: 'q1', 'aria-label': 'Match:' },
          h(M.Pair, { prompt: 'XSS', response: 'Script injection' }, h(M.Prompt, null), h(M.Response, null)),
        ),
    )

    await flushEffects()

    const spans = container.getElementsByTagName('span')
    let found = false
    for (let i = 0; i < spans.length; i++) {
      if (spans[i].textContent === 'XSS') {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })
})

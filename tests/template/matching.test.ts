import { Window } from 'happy-dom'

const window = new Window({ url: 'http://localhost' })
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

import { describe, it, expect } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import type { CourseConfig, DeliveryAdapter, CourseRuntime } from '@kurikulum/core'
import {
  CourseContext,
  createNotifier,
  createCourseRuntime,
  Matching as M,
} from '@kurikulum/core'
import type { CourseContextValue } from '@kurikulum/core'
import { Matching, MatchingPair } from '../../template/src/components/Matching.tsx'
import { QuestionFeedback } from '../../template/src/components/QuestionFeedback.tsx'
import { Assessment } from '../../template/src/components/Assessment.tsx'

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

const HappyEvent = window.Event as unknown as typeof Event

function fireChange(select: HTMLSelectElement, value: string) {
  select.value = value
  select.dispatchEvent(new HappyEvent('change', { bubbles: true }))
}

function createMockAdapter(): DeliveryAdapter & { committed: number } {
  return {
    committed: 0,
    async initialize() {},
    commit() { this.committed++ },
    setSuspendData() {},
    getSuspendData() { return null },
    setScore() {},
    setStatus() {},
    setLocation() {},
    getLocation() { return null },
    setSessionTime() {},
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
    originalSubmitScore(score, max, threshold); notify()
  }
  runtime.markComplete = (id: string) => {
    originalMarkComplete(id); notify()
  }

  return {
    runtime,
    subscribe,
    notify,
    defaultCompletion: config.defaultCompletion ?? 'mount',
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

function getSelects(container: HTMLElement): HTMLSelectElement[] {
  return Array.from(container.getElementsByTagName('select'))
}

describe('Matching', () => {
  it('renders prompts and select dropdowns', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(Matching, { id: 'q1', question: 'Match the items:' },
        h(MatchingPair, { prompt: 'A', response: '1' }),
        h(MatchingPair, { prompt: 'B', response: '2' }),
      ),
    )

    await flushEffects()

    const legend = container.getElementsByTagName('legend')[0]
    expect(legend.textContent).toBe('Match the items:')

    const selects = getSelects(container)
    expect(selects.length).toBe(2)

    // Each select should have options (placeholder + responses)
    expect(selects[0].options.length).toBe(3) // — + 1 + 2
  })

  it('responses are available in all selects', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(Matching, { id: 'q1', question: 'Match:' },
        h(MatchingPair, { prompt: 'XSS', response: 'Script injection' }),
        h(MatchingPair, { prompt: 'CSRF', response: 'Session abuse' }),
        h(MatchingPair, { prompt: 'SQLi', response: 'DB manipulation' }),
      ),
    )

    await flushEffects()

    const selects = getSelects(container)
    expect(selects.length).toBe(3)

    // Each select should have 4 options (placeholder + 3 responses)
    for (const select of selects) {
      expect(select.options.length).toBe(4)
    }

    // Collect all option values from first select (excluding placeholder)
    const optionValues = new Set<string>()
    for (let i = 1; i < selects[0].options.length; i++) {
      optionValues.add(selects[0].options[i].value)
    }
    expect(optionValues.has('Script injection')).toBe(true)
    expect(optionValues.has('Session abuse')).toBe(true)
    expect(optionValues.has('DB manipulation')).toBe(true)
  })

  it('evaluates all correct as score 1', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Matching, { id: 'q1', question: 'Match:' },
        h(MatchingPair, { prompt: 'A', response: '1' }),
        h(MatchingPair, { prompt: 'B', response: '2' }),
      ),
    )

    await flushEffects()

    const selects = getSelects(container)
    fireChange(selects[0], '1')
    rerender()
    fireChange(selects[1], '2')
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

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Matching, { id: 'q1', question: 'Match:' },
        h(MatchingPair, { prompt: 'A', response: '1' }),
        h(MatchingPair, { prompt: 'B', response: '2' }),
      ),
    )

    await flushEffects()

    const selects = getSelects(container)
    fireChange(selects[0], '1') // correct
    rerender()
    fireChange(selects[1], '1') // incorrect
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('false')
    expect(fieldset.getAttribute('data-submitted')).toBe('true')
  })

  it('data-correct on individual pairs after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(M.Root, { id: 'q1', 'aria-label': 'Match:' },
        h(M.Pair, { prompt: 'A', response: '1' },
          h(M.Prompt, null),
          h(M.Response, null),
        ),
        h(M.Pair, { prompt: 'B', response: '2' },
          h(M.Prompt, null),
          h(M.Response, null),
        ),
        h(M.Submit, null, 'Submit'),
      ),
    )

    await flushEffects()

    const selects = getSelects(container)
    fireChange(selects[0], '1') // correct
    rerender()
    fireChange(selects[1], '1') // incorrect
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const divs = container.querySelectorAll('[data-correct]')
    // fieldset + 2 pair divs = 3 elements with data-correct
    const pairDivs = Array.from(divs).filter(el => el.tagName === 'DIV')
    expect(pairDivs.length).toBe(2)
    expect(pairDivs[0].getAttribute('data-correct')).toBe('true')
    expect(pairDivs[1].getAttribute('data-correct')).toBe('false')
  })

  it('disables selects after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Matching, { id: 'q1', question: 'Match:' },
        h(MatchingPair, { prompt: 'A', response: '1' }),
        h(MatchingPair, { prompt: 'B', response: '2' }),
      ),
    )

    await flushEffects()

    const selects = getSelects(container)
    fireChange(selects[0], '1')
    rerender()
    fireChange(selects[1], '2')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    for (const select of getSelects(container)) {
      expect(select.disabled).toBe(true)
    }
    // Submit button should be hidden
    expect(container.getElementsByTagName('button').length).toBe(0)
  })

  it('submit button disabled when not all pairs selected', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(Matching, { id: 'q1', question: 'Match:' },
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

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(Matching, { id: 'q1', question: 'Match:' },
          h(MatchingPair, { prompt: 'A', response: '1' }),
          h(MatchingPair, { prompt: 'B', response: '2' }),
        ),
      ),
    )

    await flushEffects()

    const selects = getSelects(container)
    fireChange(selects[0], '1')
    rerender()
    fireChange(selects[1], '2')
    rerender()

    // Click Assessment submit
    const buttons = container.getElementsByTagName('button')
    let submitBtn: HTMLButtonElement | null = null
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent?.includes('Odeslat')) {
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

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5, maxAttempts: 3 },
        h(Matching, { id: 'q1', question: 'Match:' },
          h(MatchingPair, { prompt: 'A', response: '1' }),
          h(MatchingPair, { prompt: 'B', response: '2' }),
        ),
      ),
    )

    await flushEffects()

    // Select wrong answers and submit
    const selects = getSelects(container)
    fireChange(selects[0], '2')
    rerender()
    fireChange(selects[1], '1')
    rerender()

    const buttons = container.getElementsByTagName('button')
    let submitBtn: HTMLButtonElement | null = null
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent?.includes('Odeslat')) {
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
      if (allButtons[i].textContent?.includes('Zkusit')) {
        retryBtn = allButtons[i] as HTMLButtonElement
        break
      }
    }
    expect(retryBtn).not.toBeNull()
    retryBtn!.click()
    rerender()
    await flushEffects()

    // Selects should be re-enabled and reset
    const resetSelects = getSelects(container)
    for (const select of resetSelects) {
      expect(select.disabled).toBe(false)
      expect(select.value).toBe('')
    }
  })

  it('marks interactive completion on submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Matching, { id: 'q1', question: 'Match:' },
        h(MatchingPair, { prompt: 'A', response: '1' }),
      ),
    )

    await flushEffects()

    expect(runtime.isComplete('q1')).toBe(false)

    const selects = getSelects(container)
    fireChange(selects[0], '1')
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

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Matching, { id: 'q1', question: 'Match:' },
        h(MatchingPair, { prompt: 'A', response: '1' }),
        h(QuestionFeedback, { correct: 'All correct!', incorrect: 'Try again!' }),
      ),
    )

    await flushEffects()

    // No feedback initially
    expect(container.textContent).not.toContain('All correct!')
    expect(container.textContent).not.toContain('Try again!')

    const selects = getSelects(container)
    fireChange(selects[0], '1')
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

    const { container } = renderWithContext(ctx, () =>
      h(M.Root, { id: 'q1', 'aria-label': 'Match:' },
        h(M.Pair, { prompt: 'XSS', response: 'Script injection' },
          h(M.Prompt, null),
          h(M.Response, null),
        ),
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

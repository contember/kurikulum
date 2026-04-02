import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document
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
} from '@kurikulum/core'
import type { CourseContextValue } from '@kurikulum/core'
import { FillBlank } from '../../template/src/components/FillBlank.tsx'
import { QuestionFeedback } from '../../template/src/components/QuestionFeedback.tsx'
import { Assessment } from '../../template/src/components/Assessment.tsx'
import { FillBlank as FB } from '@kurikulum/core'

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

const HappyEvent = window.Event as unknown as typeof Event

function fireInput(input: HTMLInputElement, value: string) {
  ;(input as any).value = value
  input.dispatchEvent(new HappyEvent('input', { bubbles: true }))
}

function fireKeyDown(input: HTMLElement, key: string) {
  const event = new (window.KeyboardEvent as unknown as typeof KeyboardEvent)('keydown', { key, bubbles: true })
  input.dispatchEvent(event)
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
    originalSubmitScore(score, max, threshold); notify()
  }
  runtime.markComplete = (id: string) => {
    originalMarkComplete(id); notify()
  }

  return {
    runtime,
    adapter: createMockAdapter(),
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
  function App() {
    return h(CourseContext.Provider, { value: ctx } as any, makeTree())
  }
  render(h(App, null), container)
  return { container, rerender: () => render(h(App, null), container) }
}

describe('FillBlank', () => {
  it('renders question label and text input', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Capital of France?', accept: 'Paris', placeholder: 'Enter city...' }),
    )

    await flushEffects()

    const legends = container.getElementsByTagName('legend')
    expect(legends.length).toBe(1)
    expect(legends[0].textContent).toBe('Capital of France?')

    const inputs = container.getElementsByTagName('input')
    expect(inputs.length).toBe(1)
    expect(inputs[0].type).toBe('text')
    expect(inputs[0].placeholder).toBe('Enter city...')
  })

  it('validates correct string answer (case-insensitive)', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Capital?', accept: 'Paris' }),
    )

    await flushEffects()

    const input = container.getElementsByTagName('input')[0]
    fireInput(input, 'paris')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('true')
  })

  it('validates incorrect answer', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Capital?', accept: 'Paris' }),
    )

    await flushEffects()

    const input = container.getElementsByTagName('input')[0]
    fireInput(input, 'London')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('false')
  })

  it('validates against string array', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Capital?', accept: ['Paris', 'Paříž'] }),
    )

    await flushEffects()

    const input = container.getElementsByTagName('input')[0]
    fireInput(input, 'Paříž')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('true')
  })

  it('validates against regex', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Year?', accept: /^1991$/ }),
    )

    await flushEffects()

    const input = container.getElementsByTagName('input')[0]
    fireInput(input, '1991')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('true')
  })

  it('respects caseSensitive option', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Capital?', accept: 'Paris', caseSensitive: true }),
    )

    await flushEffects()

    const input = container.getElementsByTagName('input')[0]
    fireInput(input, 'paris')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('false')
  })

  it('disables input after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Q?', accept: 'A' }),
    )

    await flushEffects()

    const input = container.getElementsByTagName('input')[0]
    fireInput(input, 'A')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    expect(input.disabled).toBe(true)
    // Submit button should be hidden after submit
    expect(container.getElementsByTagName('button').length).toBe(0)
  })

  it('trims whitespace before comparing', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Q?', accept: 'Paris' }),
    )

    await flushEffects()

    const input = container.getElementsByTagName('input')[0]
    fireInput(input, '  Paris  ')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('true')
  })

  it('works within Assessment and evaluates correctly', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(FillBlank, { id: 'q1', question: 'Capital of France?', accept: 'Paris' }),
      ),
    )

    await flushEffects()

    // Type correct answer
    const input = container.getElementsByTagName('input')[0]
    fireInput(input, 'Paris')
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

    // Score should be submitted
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
        h(FillBlank, { id: 'q1', question: 'Q?', accept: 'Paris' }),
      ),
    )

    await flushEffects()

    // Type wrong answer and submit
    const input = container.getElementsByTagName('input')[0]
    fireInput(input, 'London')
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

    // Input should be reset and enabled
    expect(input.disabled).toBe(false)
    expect(input.value).toBe('')
  })

  it('shows feedback with correct/incorrect children', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Q?', accept: 'Paris' },
        h(QuestionFeedback, { correct: 'Correct!', incorrect: 'Wrong!' }),
      ),
    )

    await flushEffects()

    // No feedback initially
    expect(container.textContent).not.toContain('Correct!')
    expect(container.textContent).not.toContain('Wrong!')

    const input = container.getElementsByTagName('input')[0]
    fireInput(input, 'Paris')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    expect(container.textContent).toContain('Correct!')
  })

  it('marks interactive completion on submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Q?', accept: 'Paris' }),
    )

    await flushEffects()

    expect(runtime.isComplete('q1')).toBe(false)

    const input = container.getElementsByTagName('input')[0]
    fireInput(input, 'Paris')
    rerender()

    const button = container.getElementsByTagName('button')[0]
    button.click()
    rerender()
    await flushEffects()

    expect(runtime.isComplete('q1')).toBe(true)
  })

  it('submit button disabled when input is empty', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(FillBlank, { id: 'q1', question: 'Q?', accept: 'Paris' }),
    )

    await flushEffects()

    const button = container.getElementsByTagName('button')[0]
    expect(button.disabled).toBe(true)
  })
})

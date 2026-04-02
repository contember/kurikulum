import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(private callback: IntersectionObserverCallback, private options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// happy-dom's HTMLInputElement.checked setter calls #setChecked which uses
// querySelectorAll(':scope ...') and crashes in detached documents.
// Patch it to a simple property so Preact can set checked without crashing.
const inputProto = (window as any).HTMLInputElement.prototype
Object.defineProperty(inputProto, 'checked', {
  get() { return this._checked ?? false },
  set(value: boolean) { this._checked = !!value },
  configurable: true,
})

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
import { Assessment } from './Assessment.tsx'
import { MCQ } from './MCQ.tsx'
import { MultiSelect } from './MultiSelect.tsx'
import { Option } from './Option.tsx'
import { QuestionFeedback } from './QuestionFeedback.tsx'

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

// happy-dom crashes on .click() for radio/checkbox inputs.
// Dispatch change event using happy-dom's Event class instead.
const HappyEvent = window.Event as unknown as typeof Event

function fireChange(input: HTMLElement) {
  input.dispatchEvent(new HappyEvent('change', { bubbles: true }))
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
  makeTree: () => ReturnType<typeof h>,
) {
  const container = document.createElement('div')
  function App() {
    return h(CourseContext.Provider, { value: ctx } as any, makeTree())
  }
  render(h(App, null), container)
  return { container, rerender: () => render(h(App, null), container) }
}

describe('Option', () => {
  it('renders children', () => {
    const container = document.createElement('div')
    render(h(Option, { correct: true }, 'Answer A'), container)
    expect(container.textContent).toBe('Answer A')
  })
})

describe('MCQ', () => {
  it('renders question and radio options', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(MCQ, { id: 'q1', question: 'What is 1+1?' },
        h(Option, { correct: true }, '2'),
        h(Option, null, '3'),
        h(Option, null, '4'),
      ),
    )

    await flushEffects()

    const legends = container.getElementsByTagName('legend')
    expect(legends.length).toBe(1)
    expect(legends[0].textContent).toBe('What is 1+1?')

    const inputs = container.getElementsByTagName('input')
    expect(inputs.length).toBe(3)
    expect(inputs[0].type).toBe('radio')
    expect(inputs[1].type).toBe('radio')
    expect(inputs[2].type).toBe('radio')
  })

  it('allows selecting one answer', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(MCQ, { id: 'q1', question: 'Q?' },
        h(Option, { correct: true }, 'A'),
        h(Option, null, 'B'),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[1])
    rerender()

    expect(inputs[1].checked).toBe(true)

    fireChange(inputs[0])
    rerender()

    expect(inputs[0].checked).toBe(true)
  })

  it('marks complete on submit within Assessment', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(MCQ, { id: 'q1', question: 'Q?' },
          h(Option, { correct: true }, 'Right'),
          h(Option, null, 'Wrong'),
        ),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const buttons = container.getElementsByTagName('button')
    const submitBtn = Array.from(buttons).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()

    expect(runtime.isComplete('q1')).toBe(true)
  })

  it('shows standalone submit button when outside Assessment', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(MCQ, { id: 'q1', question: 'Q?' },
        h(Option, { correct: true }, 'A'),
        h(Option, null, 'B'),
      ),
    )

    await flushEffects()

    const buttons = container.getElementsByTagName('button')
    expect(buttons.length).toBe(1)
    expect(buttons[0].textContent).toBe('Odeslat')
  })
})

describe('MultiSelect', () => {
  it('renders question and checkbox options', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(MultiSelect, { id: 'q2', question: 'Select languages:' },
        h(Option, { correct: true }, 'Python'),
        h(Option, { correct: true }, 'JS'),
        h(Option, null, 'HTML'),
      ),
    )

    await flushEffects()

    const legends = container.getElementsByTagName('legend')
    expect(legends[0].textContent).toBe('Select languages:')

    const inputs = container.getElementsByTagName('input')
    expect(inputs.length).toBe(3)
    expect(inputs[0].type).toBe('checkbox')
  })

  it('allows selecting multiple answers', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(MultiSelect, { id: 'q2', question: 'Q?' },
        h(Option, { correct: true }, 'A'),
        h(Option, { correct: true }, 'B'),
        h(Option, null, 'C'),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()
    fireChange(inputs[1])
    rerender()

    expect(inputs[0].checked).toBe(true)
    expect(inputs[1].checked).toBe(true)
    expect(inputs[2].checked).toBe(false)
  })

  it('toggles checkbox off on second click', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(MultiSelect, { id: 'q2', question: 'Q?' },
        h(Option, { correct: true }, 'A'),
        h(Option, null, 'B'),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()
    expect(inputs[0].checked).toBe(true)

    fireChange(inputs[0])
    rerender()
    expect(inputs[0].checked).toBe(false)
  })
})

describe('QuestionFeedback', () => {
  it('shows correct feedback after correct answer', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(MCQ, { id: 'q1', question: 'Capital of CZ?' },
          h(Option, { correct: true }, 'Prague'),
          h(Option, null, 'Brno'),
          h(QuestionFeedback, { correct: 'Correct!', incorrect: 'Wrong answer.' }),
        ),
      ),
    )

    await flushEffects()

    expect(container.textContent).not.toContain('Correct!')
    expect(container.textContent).not.toContain('Wrong answer.')

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const buttons = container.getElementsByTagName('button')
    const submitBtn = Array.from(buttons).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(container.textContent).toContain('Correct!')
    expect(container.textContent).not.toContain('Wrong answer.')
  })

  it('shows incorrect feedback after wrong answer', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(MCQ, { id: 'q1', question: 'Capital of CZ?' },
          h(Option, { correct: true }, 'Prague'),
          h(Option, null, 'Brno'),
          h(QuestionFeedback, { correct: 'Correct!', incorrect: 'Wrong answer.' }),
        ),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[1])
    rerender()

    const buttons = container.getElementsByTagName('button')
    const submitBtn = Array.from(buttons).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(container.textContent).toContain('Wrong answer.')
    expect(container.textContent).not.toContain('Correct!')
  })
})

describe('Assessment', () => {
  it('calculates score from all questions', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(MCQ, { id: 'q1', question: 'Q1' },
          h(Option, { correct: true }, 'Right'),
          h(Option, null, 'Wrong'),
        ),
        h(MCQ, { id: 'q2', question: 'Q2' },
          h(Option, null, 'Wrong'),
          h(Option, { correct: true }, 'Right'),
        ),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // q1: correct
    rerender()
    fireChange(inputs[2]) // q2: wrong (first option of q2)
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.score).toBe(1)
    expect(runtime.state.maxScore).toBe(2)
    expect(runtime.state.attempts).toBe(1)
    expect(container.textContent).toContain('1/2')
  })

  it('shows passed when threshold met', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(MCQ, { id: 'q1', question: 'Q1' },
          h(Option, { correct: true }, 'Right'),
          h(Option, null, 'Wrong'),
        ),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.passed).toBe(true)
    expect(container.textContent).toContain('Splněno!')
  })

  it('shows failed when threshold not met', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 1.0 },
        h(MCQ, { id: 'q1', question: 'Q1' },
          h(Option, { correct: true }, 'Right'),
          h(Option, null, 'Wrong'),
        ),
        h(MCQ, { id: 'q2', question: 'Q2' },
          h(Option, null, 'Wrong'),
          h(Option, { correct: true }, 'Right'),
        ),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // q1: correct
    rerender()
    fireChange(inputs[2]) // q2: wrong
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.passed).toBe(false)
    expect(container.textContent).toContain('Nesplněno.')
  })

  it('limits attempts with maxAttempts', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 1.0, maxAttempts: 1 },
        h(MCQ, { id: 'q1', question: 'Q1' },
          h(Option, null, 'Wrong'),
          h(Option, { correct: true }, 'Right'),
        ),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(container.textContent).toContain('Vyčerpány všechny pokusy')
    const retryBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Zkusit znovu')
    expect(retryBtn).toBeUndefined()
  })

  it('allows retry when maxAttempts not reached', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 1.0, maxAttempts: 2 },
        h(MCQ, { id: 'q1', question: 'Q1' },
          h(Option, null, 'Wrong'),
          h(Option, { correct: true }, 'Right'),
        ),
      ),
    )

    await flushEffects()

    // First attempt: answer incorrectly
    let inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    let submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.attempts).toBe(1)

    // Retry button should appear
    const retryBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Zkusit znovu')
    expect(retryBtn).toBeDefined()
    retryBtn!.click()
    rerender()

    await flushEffects()
    rerender()

    // Should be able to answer again
    inputs = container.getElementsByTagName('input')
    expect(inputs[0].disabled).toBe(false)

    // Now answer correctly
    fireChange(inputs[1])
    rerender()

    submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.attempts).toBe(2)
    expect(runtime.state.passed).toBe(true)
    expect(container.textContent).toContain('Splněno!')
  })

  it('works with MultiSelect questions', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(MultiSelect, { id: 'q1', question: 'Select languages:' },
          h(Option, { correct: true }, 'Python'),
          h(Option, { correct: true }, 'JavaScript'),
          h(Option, null, 'HTML'),
          h(Option, null, 'Photoshop'),
        ),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // Python
    rerender()
    fireChange(inputs[1]) // JavaScript
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.score).toBe(1)
    expect(runtime.state.maxScore).toBe(1)
    expect(runtime.state.passed).toBe(true)
  })

  it('MultiSelect is incorrect when extra wrong answers selected', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 1.0 },
        h(MultiSelect, { id: 'q1', question: 'Select languages:' },
          h(Option, { correct: true }, 'Python'),
          h(Option, { correct: true }, 'JavaScript'),
          h(Option, null, 'HTML'),
        ),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()
    fireChange(inputs[1])
    rerender()
    fireChange(inputs[2])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.score).toBe(0)
    expect(runtime.state.passed).toBe(false)
  })

  it('disables inputs after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(MCQ, { id: 'q1', question: 'Q1' },
          h(Option, { correct: true }, 'A'),
          h(Option, null, 'B'),
        ),
      ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Odeslat')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    const updatedInputs = container.getElementsByTagName('input')
    for (let i = 0; i < updatedInputs.length; i++) {
      expect(updatedInputs[i].disabled).toBe(true)
    }
  })

  it('has ARIA attributes', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz' },
        h(MCQ, { id: 'q1', question: 'Test question' },
          h(Option, { correct: true }, 'A'),
        ),
      ),
    )

    await flushEffects()

    const divs = Array.from(container.getElementsByTagName('div'))
    const region = divs.find(d => d.getAttribute('role') === 'region')
    expect(region).toBeDefined()
    expect(region!.getAttribute('aria-label')).toBe('Assessment')

    const fieldsets = container.getElementsByTagName('fieldset')
    expect(fieldsets[0].getAttribute('role')).toBe('radiogroup')
    expect(fieldsets[0].getAttribute('aria-label')).toBe('Test question')
  })
})

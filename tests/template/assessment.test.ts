import { Window as HappyWindow } from 'happy-dom'

const window = new HappyWindow()
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
  get() {
    return this._checked ?? false
  },
  set(value: boolean) {
    this._checked = !!value
  },
  configurable: true,
})

import { describe, expect, it } from 'bun:test'
import type { CourseConfig, CourseRuntime, DeliveryAdapter } from 'kurikulum'
import { CourseContext, createCourseRuntime, createNotifier } from 'kurikulum'
import type { CourseContextValue } from 'kurikulum'
import { h } from 'preact'
import { render } from 'preact'
import { Assessment } from '../../template/src/components/Assessment.tsx'
import { MCQ } from '../../template/src/components/MCQ.tsx'
import { MultiSelect } from '../../template/src/components/MultiSelect.tsx'
import { Option } from '../../template/src/components/Option.tsx'
import { QuestionFeedback } from '../../template/src/components/QuestionFeedback.tsx'

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

    const { container } = renderWithContext(
      ctx,
      () => h(MCQ, { id: 'q1', question: 'What is 1+1?' }, h(Option, { correct: true }, '2'), h(Option, null, '3'), h(Option, null, '4')),
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

    const { container, rerender } = renderWithContext(
      ctx,
      () => h(MCQ, { id: 'q1', question: 'Q?' }, h(Option, { correct: true }, 'A'), h(Option, null, 'B')),
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

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q?' }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const buttons = container.getElementsByTagName('button')
    const submitBtn = Array.from(buttons).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()

    expect(runtime.isComplete('q1')).toBe(true)
  })

  it('shows standalone submit button when outside Assessment', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () => h(MCQ, { id: 'q1', question: 'Q?' }, h(Option, { correct: true }, 'A'), h(Option, null, 'B')))

    await flushEffects()

    const buttons = container.getElementsByTagName('button')
    expect(buttons.length).toBe(1)
    expect(buttons[0].textContent).toBe('Submit')
  })
})

describe('MultiSelect', () => {
  it('renders question and checkbox options', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(
      ctx,
      () =>
        h(
          MultiSelect,
          { id: 'q2', question: 'Select languages:' },
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

    const { container, rerender } = renderWithContext(
      ctx,
      () => h(MultiSelect, { id: 'q2', question: 'Q?' }, h(Option, { correct: true }, 'A'), h(Option, { correct: true }, 'B'), h(Option, null, 'C')),
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

    const { container, rerender } = renderWithContext(
      ctx,
      () => h(MultiSelect, { id: 'q2', question: 'Q?' }, h(Option, { correct: true }, 'A'), h(Option, null, 'B')),
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

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(
            MCQ,
            { id: 'q1', question: 'Capital of CZ?' },
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
    const submitBtn = Array.from(buttons).find(b => b.textContent === 'Submit')!
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

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(
            MCQ,
            { id: 'q1', question: 'Capital of CZ?' },
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
    const submitBtn = Array.from(buttons).find(b => b.textContent === 'Submit')!
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

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
          h(MCQ, { id: 'q2', question: 'Q2' }, h(Option, null, 'Wrong'), h(Option, { correct: true }, 'Right')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // q1: correct
    rerender()
    fireChange(inputs[2]) // q2: wrong (first option of q2)
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
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

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.passed).toBe(true)
    expect(container.textContent).toContain('Passed!')
  })

  it('shows failed when threshold not met', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 1.0 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
          h(MCQ, { id: 'q2', question: 'Q2' }, h(Option, null, 'Wrong'), h(Option, { correct: true }, 'Right')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // q1: correct
    rerender()
    fireChange(inputs[2]) // q2: wrong
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.passed).toBe(false)
    expect(container.textContent).toContain('Not passed.')
  })

  it('limits attempts with maxAttempts', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 1.0, maxAttempts: 1 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, null, 'Wrong'), h(Option, { correct: true }, 'Right')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(container.textContent).toContain('No attempts remaining')
    const retryBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Try again')
    expect(retryBtn).toBeUndefined()
  })

  it('allows retry when maxAttempts not reached', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 1.0, maxAttempts: 2 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, null, 'Wrong'), h(Option, { correct: true }, 'Right')),
        ),
    )

    await flushEffects()

    // First attempt: answer incorrectly
    let inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    let submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.attempts).toBe(1)

    // Retry button should appear
    const retryBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Try again')
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

    submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.attempts).toBe(2)
    expect(runtime.state.passed).toBe(true)
    expect(container.textContent).toContain('Passed!')
  })

  it('works with MultiSelect questions', async () => {
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
            MultiSelect,
            { id: 'q1', question: 'Select languages:' },
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

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
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

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 1.0 },
          h(
            MultiSelect,
            { id: 'q1', question: 'Select languages:' },
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

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.score).toBe(0.5)
    expect(runtime.state.passed).toBe(false)
  })

  it('disables inputs after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, { correct: true }, 'A'), h(Option, null, 'B')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
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

    const { container } = renderWithContext(
      ctx,
      () => h(Assessment, { id: 'quiz' }, h(MCQ, { id: 'q1', question: 'Test question' }, h(Option, { correct: true }, 'A'))),
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

  it('has aria-disabled on inputs after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, { correct: true }, 'A'), h(Option, null, 'B')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    for (let i = 0; i < inputs.length; i++) {
      expect(inputs[i].getAttribute('aria-disabled')).toBe('true')
    }
  })

  it('shows icon alongside color in assessment status', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(container.textContent).toContain('✓ Passed!')
  })

  it('shows failure icon alongside color in assessment status', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 1.0 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[1])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(container.textContent).toContain('✗ Not passed.')
  })
})

describe('MultiSelect a11y', () => {
  it('has role="group" on fieldset', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(
      ctx,
      () => h(MultiSelect, { id: 'q1', question: 'Select:' }, h(Option, { correct: true }, 'A'), h(Option, null, 'B')),
    )

    await flushEffects()

    const fieldsets = container.getElementsByTagName('fieldset')
    expect(fieldsets[0].getAttribute('role')).toBe('group')
    expect(fieldsets[0].getAttribute('aria-label')).toBe('Select:')
  })

  it('has aria-disabled on checkboxes after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MultiSelect, { id: 'q1', question: 'Q?' }, h(Option, { correct: true }, 'A'), h(Option, null, 'B')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    for (let i = 0; i < inputs.length; i++) {
      expect(inputs[i].getAttribute('aria-disabled')).toBe('true')
    }
  })
})

describe('QuestionFeedback a11y', () => {
  it('shows icon alongside feedback text', async () => {
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
            MCQ,
            { id: 'q1', question: 'Q?' },
            h(Option, { correct: true }, 'Right'),
            h(Option, null, 'Wrong'),
            h(QuestionFeedback, { correct: 'Well done!', incorrect: 'Try again.' }),
          ),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    // Should have icon prefix alongside text
    expect(container.textContent).toContain('✓')
    expect(container.textContent).toContain('Well done!')
  })

  it('shows incorrect icon for wrong answer feedback', async () => {
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
            MCQ,
            { id: 'q1', question: 'Q?' },
            h(Option, { correct: true }, 'Right'),
            h(Option, null, 'Wrong'),
            h(QuestionFeedback, { correct: 'Well done!', incorrect: 'Try again.' }),
          ),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[1])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(container.textContent).toContain('✗')
    expect(container.textContent).toContain('Try again.')
  })
})

describe('Weighted scoring', () => {
  it('MCQ evaluator returns 0 or 1', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0])
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.score).toBe(1)
    expect(runtime.state.maxScore).toBe(1)
  })

  it('weight prop affects score calculation', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    // q1 weight=2 (correct), q2 weight=3 (incorrect)
    // weightedScore = 1*2 + 0*3 = 2, totalWeight = 5
    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q1', weight: 2 }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
          h(MCQ, { id: 'q2', question: 'Q2', weight: 3 }, h(Option, null, 'Wrong'), h(Option, { correct: true }, 'Right')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // q1: correct
    rerender()
    fireChange(inputs[2]) // q2: wrong (first option of q2)
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.score).toBe(2)
    expect(runtime.state.maxScore).toBe(5)
    // 2/5 = 0.4 < 0.5 → failed
    expect(runtime.state.passed).toBe(false)
  })

  it('default weight is 1', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q1' }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
          h(MCQ, { id: 'q2', question: 'Q2' }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // q1: correct
    rerender()
    fireChange(inputs[2]) // q2: correct
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    expect(runtime.state.score).toBe(2)
    expect(runtime.state.maxScore).toBe(2)
    expect(runtime.state.passed).toBe(true)
  })
})

describe('MultiSelect partial credit', () => {
  it('gives full credit for all correct selected', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MultiSelect, { id: 'q1', question: 'Q?' }, h(Option, { correct: true }, 'A'), h(Option, { correct: true }, 'B'), h(Option, null, 'C')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // A correct
    rerender()
    fireChange(inputs[1]) // B correct
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    // (2 - 0) / 2 = 1.0
    expect(runtime.state.score).toBe(1)
    expect(runtime.state.maxScore).toBe(1)
  })

  it('gives partial credit for some correct selected', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MultiSelect, { id: 'q1', question: 'Q?' }, h(Option, { correct: true }, 'A'), h(Option, { correct: true }, 'B'), h(Option, null, 'C')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // A correct only
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    // (1 - 0) / 2 = 0.5
    expect(runtime.state.score).toBe(0.5)
    expect(runtime.state.maxScore).toBe(1)
  })

  it('penalizes incorrect selections', async () => {
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
            MultiSelect,
            { id: 'q1', question: 'Q?' },
            h(Option, { correct: true }, 'A'),
            h(Option, { correct: true }, 'B'),
            h(Option, null, 'C'),
            h(Option, null, 'D'),
          ),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // A correct
    rerender()
    fireChange(inputs[2]) // C incorrect
    rerender()
    fireChange(inputs[3]) // D incorrect
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    // (1 - 2) / 2 = -0.5 → max(0, -0.5) = 0
    expect(runtime.state.score).toBe(0)
    expect(runtime.state.maxScore).toBe(1)
  })

  it('gives zero when no correct selected and one incorrect', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MultiSelect, { id: 'q1', question: 'Q?' }, h(Option, { correct: true }, 'A'), h(Option, null, 'B')),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[1]) // B incorrect
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    // (0 - 1) / 1 = -1 → max(0, -1) = 0
    expect(runtime.state.score).toBe(0)
    expect(runtime.state.maxScore).toBe(1)
  })

  it('MultiSelect with weight in assessment', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    // MCQ weight=1 (correct), MultiSelect weight=3 (partial: 1 of 2 correct)
    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          Assessment,
          { id: 'quiz', passThreshold: 0.5 },
          h(MCQ, { id: 'q1', question: 'Q1', weight: 1 }, h(Option, { correct: true }, 'Right'), h(Option, null, 'Wrong')),
          h(
            MultiSelect,
            { id: 'q2', question: 'Q2', weight: 3 },
            h(Option, { correct: true }, 'A'),
            h(Option, { correct: true }, 'B'),
            h(Option, null, 'C'),
          ),
        ),
    )

    await flushEffects()

    const inputs = container.getElementsByTagName('input')
    fireChange(inputs[0]) // q1: correct → 1
    rerender()
    fireChange(inputs[2]) // q2: select first correct only → 0.5
    rerender()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(b => b.textContent === 'Submit')!
    submitBtn.click()
    rerender()

    await flushEffects()
    rerender()

    // weightedScore = 1*1 + 0.5*3 = 2.5, totalWeight = 4
    expect(runtime.state.score).toBe(2.5)
    expect(runtime.state.maxScore).toBe(4)
    // 2.5/4 = 0.625 > 0.5 → passed
    expect(runtime.state.passed).toBe(true)
  })
})

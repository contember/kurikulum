import { Window as HappyWindow } from 'happy-dom'

const window = new HappyWindow({ url: 'http://localhost' })
globalThis.document = window.document as unknown as Document

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
  Ordering as O,
} from '@kurikulum/core'
import type { CourseContextValue } from '@kurikulum/core'
import { Ordering, OrderingItem } from '../../template/src/components/Ordering.tsx'
import { QuestionFeedback } from '../../template/src/components/QuestionFeedback.tsx'
import { Assessment } from '../../template/src/components/Assessment.tsx'

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
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
    pageConditions: {},
    getVisiblePages: () => [],
    restoreInfo: { restored: false, storedPage: null },
    restoreDismissed: false,
    dismissRestore() { notify() },
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

/** Get items sorted by their CSS order (visual order) */
function getOrderedItems(container: HTMLElement): { el: HTMLElement, text: string, order: number }[] {
  const listItems = Array.from(container.querySelectorAll('[role="list"] > div')) as HTMLElement[]
  return listItems
    .map(el => {
      const span = el.querySelector('span')
      const orderStr = el.style?.order ?? '0'
      return {
        el,
        text: span?.textContent?.trim() ?? '',
        order: parseInt(orderStr, 10) || 0,
      }
    })
    .sort((a, b) => a.order - b.order)
}

function getItemTexts(container: HTMLElement): string[] {
  return getOrderedItems(container).map(i => i.text)
}

/** Get move buttons for a specific item element */
function getItemButtons(item: HTMLElement): { up: HTMLButtonElement, down: HTMLButtonElement } {
  const buttons = Array.from(item.getElementsByTagName('button'))
  const up = buttons.find(b => b.getAttribute('aria-label') === 'Move up')!
  const down = buttons.find(b => b.getAttribute('aria-label') === 'Move down')!
  return { up, down }
}

/** Get all move buttons sorted by visual order */
function getMoveButtonsOrdered(container: HTMLElement): { upButtons: HTMLButtonElement[], downButtons: HTMLButtonElement[] } {
  const items = getOrderedItems(container)
  const upButtons = items.map(i => getItemButtons(i.el).up)
  const downButtons = items.map(i => getItemButtons(i.el).down)
  return { upButtons, downButtons }
}

/** Arrange items to correct order by clicking move buttons */
async function arrangeCorrectly(container: HTMLElement, rerender: () => void, correctOrder: string[]): Promise<void> {
  for (let pass = 0; pass < correctOrder.length * correctOrder.length; pass++) {
    const texts = getItemTexts(container)
    let allCorrect = true
    for (let i = 0; i < correctOrder.length; i++) {
      if (texts[i] !== correctOrder[i]) { allCorrect = false; break }
    }
    if (allCorrect) return

    // Find first item out of place and move it up
    for (let i = 0; i < correctOrder.length; i++) {
      if (texts[i] !== correctOrder[i]) {
        const currentPos = texts.indexOf(correctOrder[i])
        if (currentPos > i) {
          const items = getOrderedItems(container)
          const { up } = getItemButtons(items[currentPos].el)
          up.click()
          rerender()
          await flushEffects()
          break
        }
      }
    }
  }
}

describe('Ordering', () => {
  it('renders items with move buttons', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort the steps:' },
        h(OrderingItem, { order: 0 }, 'First'),
        h(OrderingItem, { order: 1 }, 'Second'),
        h(OrderingItem, { order: 2 }, 'Third'),
      ),
    )

    await flushEffects()

    const legend = container.getElementsByTagName('legend')[0]
    expect(legend.textContent).toBe('Sort the steps:')

    const { upButtons, downButtons } = getMoveButtonsOrdered(container)
    expect(upButtons.length).toBe(3)
    expect(downButtons.length).toBe(3)
  })

  it('displays items in shuffled order', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    let foundDifferent = false
    for (let i = 0; i < 20; i++) {
      const container = document.createElement('div')
      document.body.appendChild(container)
      function App() {
        return h(CourseContext.Provider, { value: ctx } as any,
          h(Ordering, { id: `q-shuffle-${i}`, question: 'Sort:' },
            h(OrderingItem, { order: 0 }, 'A'),
            h(OrderingItem, { order: 1 }, 'B'),
            h(OrderingItem, { order: 2 }, 'C'),
            h(OrderingItem, { order: 3 }, 'D'),
          ),
        )
      }
      render(h(App, null), container)
      await flushEffects()

      const texts = getItemTexts(container)
      if (texts.join(',') !== 'A,B,C,D') {
        foundDifferent = true
        break
      }
    }
    expect(foundDifferent).toBe(true)
  })

  it('move up/down buttons reorder items', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
        h(OrderingItem, { order: 2 }, 'C'),
      ),
    )

    await flushEffects()

    const initialTexts = getItemTexts(container)
    expect(initialTexts.length).toBe(3)

    // Click "move down" on the first visual item
    const items = getOrderedItems(container)
    const { down } = getItemButtons(items[0].el)
    down.click()
    rerender()
    await flushEffects()

    const afterTexts = getItemTexts(container)
    // First two items should be swapped
    expect(afterTexts[0]).toBe(initialTexts[1])
    expect(afterTexts[1]).toBe(initialTexts[0])
    expect(afterTexts[2]).toBe(initialTexts[2])
  })

  it('evaluates all correct as score 1', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
      ),
    )

    await flushEffects()

    await arrangeCorrectly(container, rerender, ['A', 'B'])

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat')
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('true')
  })

  it('evaluates incorrect order with partial credit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
        h(OrderingItem, { order: 2 }, 'C'),
      ),
    )

    await flushEffects()

    // Arrange in wrong order: B, A, C — 1 correct (C at position 2)
    await arrangeCorrectly(container, rerender, ['B', 'A', 'C'])

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat')
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-submitted')).toBe('true')
    expect(fieldset.getAttribute('data-correct')).toBe('false')
  })

  it('data-correct on individual items after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
      ),
    )

    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat')
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const items = getOrderedItems(container)
    for (const item of items) {
      const dc = item.el.getAttribute('data-correct')
      expect(dc === 'true' || dc === 'false').toBe(true)
    }
  })

  it('disables move buttons after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
      ),
    )

    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat')
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const { upButtons, downButtons } = getMoveButtonsOrdered(container)
    for (const btn of [...upButtons, ...downButtons]) {
      expect(btn.disabled).toBe(true)
    }

    // Submit button should be hidden
    const submitBtns = Array.from(container.getElementsByTagName('button')).filter(
      b => b.textContent?.includes('Odeslat')
    )
    expect(submitBtns.length).toBe(0)
  })

  it('first item has move up disabled, last has move down disabled', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
        h(OrderingItem, { order: 2 }, 'C'),
      ),
    )

    await flushEffects()

    const { upButtons, downButtons } = getMoveButtonsOrdered(container)
    expect(upButtons.length).toBe(3)
    expect(downButtons.length).toBe(3)

    // First displayed item's move up should be disabled
    expect(upButtons[0].disabled).toBe(true)
    // Last displayed item's move down should be disabled
    expect(downButtons[downButtons.length - 1].disabled).toBe(true)
    // Middle items should have both enabled
    expect(upButtons[1].disabled).toBe(false)
    expect(downButtons[1].disabled).toBe(false)
  })

  it('works within Assessment', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Assessment, { id: 'quiz', passThreshold: 0.5 },
        h(Ordering, { id: 'q1', question: 'Sort:' },
          h(OrderingItem, { order: 0 }, 'A'),
          h(OrderingItem, { order: 1 }, 'B'),
        ),
      ),
    )

    await flushEffects()

    await arrangeCorrectly(container, rerender, ['A', 'B'])

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
      h(Assessment, { id: 'quiz', passThreshold: 1, maxAttempts: 3 },
        h(Ordering, { id: 'q1', question: 'Sort:' },
          h(OrderingItem, { order: 0 }, 'A'),
          h(OrderingItem, { order: 1 }, 'B'),
          h(OrderingItem, { order: 2 }, 'C'),
        ),
      ),
    )

    await flushEffects()

    // Arrange in wrong order
    await arrangeCorrectly(container, rerender, ['C', 'B', 'A'])

    // Submit
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

    // Move buttons should be re-enabled (at least some)
    const { upButtons, downButtons } = getMoveButtonsOrdered(container)
    const enabledButtons = [...upButtons, ...downButtons].filter(b => !b.disabled)
    expect(enabledButtons.length).toBeGreaterThan(0)
  })

  it('marks interactive completion on submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
      ),
    )

    await flushEffects()

    expect(runtime.isComplete('q1')).toBe(false)

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat')
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    expect(runtime.isComplete('q1')).toBe(true)
  })

  it('shows feedback via QuestionFeedback', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(QuestionFeedback, { correct: 'All correct!', incorrect: 'Try again!' }),
      ),
    )

    await flushEffects()

    expect(container.textContent).not.toContain('All correct!')
    expect(container.textContent).not.toContain('Try again!')

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat')
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const hasFeedback = container.textContent?.includes('All correct!') || container.textContent?.includes('Try again!')
    expect(hasFeedback).toBe(true)
  })
})

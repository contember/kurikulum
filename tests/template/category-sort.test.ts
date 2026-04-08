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

import { describe, expect, it } from 'bun:test'
import type { CourseConfig, CourseRuntime, DeliveryAdapter } from 'kurikulum'
import { Assessment as A, CategorySort as CS, CategorySortContext, CourseContext, createCourseRuntime, createNotifier } from 'kurikulum'
import type { CategorySortContextValue, CourseContextValue } from 'kurikulum'
import { h } from 'preact'
import { render } from 'preact'
import { useContext } from 'preact/hooks'

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

function createMockAdapter(): DeliveryAdapter & { committed: number; interactions: any[] } {
  return {
    committed: 0,
    interactions: [],
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
    recordInteraction(i: any) {
      this.interactions.push(i)
    },
    terminate() {},
  }
}

const config: CourseConfig = {
  title: 'Test Course',
  pages: ['page-1'],
  defaultCompletion: 'manual',
  passThreshold: 0.7,
}

function createTestContext(runtime: CourseRuntime, adapter?: DeliveryAdapter): CourseContextValue & { notify: () => void } {
  const { subscribe, notify } = createNotifier()
  const realAdapter = adapter ?? createMockAdapter()

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
    adapter: realAdapter,
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

const categories = [
  { id: 'plastic', label: 'Plast' },
  { id: 'paper', label: 'Papír' },
  { id: 'glass', label: 'Sklo' },
]

const items = [
  { id: 'bottle', label: 'PET lahev', category: 'plastic' },
  { id: 'newspaper', label: 'Noviny', category: 'paper' },
  { id: 'jar', label: 'Zavařovací sklenice', category: 'glass' },
]

/** Helper component that exposes CategorySort context via a ref-like pattern */
let capturedCtx: CategorySortContextValue | null = null
function ContextCapture() {
  capturedCtx = useContext(CategorySortContext)
  return null
}

/** Helper to programmatically assign items via context */
function assignItems(assignments: Array<[string, string]>, rerender: () => void) {
  for (const [itemId, catId] of assignments) {
    capturedCtx!.assign(itemId, catId)
  }
  rerender()
}

describe('CategorySort', () => {
  it('renders categories and items', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items } as any,
          h(CS.Item, { id: 'bottle' }),
          h(CS.Item, { id: 'newspaper' }),
          h(CS.Item, { id: 'jar' }),
          h(CS.Category, { id: 'plastic' }),
          h(CS.Category, { id: 'paper' }),
          h(CS.Category, { id: 'glass' }),
          h(CS.Submit, null, 'Odeslat'),
        ),
    )

    await flushEffects()

    expect(container.querySelector('[data-item="bottle"]')).not.toBeNull()
    expect(container.querySelector('[data-item="newspaper"]')).not.toBeNull()
    expect(container.querySelector('[data-item="jar"]')).not.toBeNull()
    expect(container.querySelector('[data-category="plastic"]')).not.toBeNull()
    expect(container.querySelector('[data-category="paper"]')).not.toBeNull()
    expect(container.querySelector('[data-category="glass"]')).not.toBeNull()
  })

  it('items are draggable', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container } = renderWithContext(
      ctx,
      () => h(CS.Root, { id: 'cs1', categories, items } as any, h(CS.Item, { id: 'bottle' }), h(CS.Category, { id: 'plastic' })),
    )

    await flushEffects()

    const item = container.querySelector('[data-item="bottle"]') as HTMLElement
    expect(item.getAttribute('draggable')).toBe('true')
  })

  it('standalone submit and scoring — all correct', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items } as any,
          h(ContextCapture, null),
          h(CS.Item, { id: 'bottle' }),
          h(CS.Item, { id: 'newspaper' }),
          h(CS.Item, { id: 'jar' }),
          h(CS.Category, { id: 'plastic' }),
          h(CS.Category, { id: 'paper' }),
          h(CS.Category, { id: 'glass' }),
          h(CS.Submit, null, 'Odeslat'),
          h(CS.Feedback, { correct: 'All correct!', incorrect: 'Try again!' }),
        ),
    )

    await flushEffects()

    // Assign all correctly
    assignItems([['bottle', 'plastic'], ['newspaper', 'paper'], ['jar', 'glass']], rerender)
    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-submitted')).toBe('true')
    expect(fieldset.getAttribute('data-correct')).toBe('true')
    expect(container.textContent).toContain('All correct!')
  })

  it('partial credit scoring', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items } as any,
          h(ContextCapture, null),
          h(CS.Item, { id: 'bottle' }),
          h(CS.Item, { id: 'newspaper' }),
          h(CS.Item, { id: 'jar' }),
          h(CS.Category, { id: 'plastic' }),
          h(CS.Category, { id: 'paper' }),
          h(CS.Category, { id: 'glass' }),
          h(CS.Submit, null, 'Odeslat'),
          h(CS.Feedback, { correct: 'Correct!', incorrect: 'Wrong!' }),
        ),
    )

    await flushEffects()

    // 1 correct, 2 wrong
    assignItems([['bottle', 'plastic'], ['newspaper', 'glass'], ['jar', 'paper']], rerender)
    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('data-correct')).toBe('false')
    expect(container.textContent).toContain('Wrong!')
  })

  it('submit button disabled when not all items assigned', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items } as any,
          h(CS.Item, { id: 'bottle' }),
          h(CS.Item, { id: 'newspaper' }),
          h(CS.Item, { id: 'jar' }),
          h(CS.Category, { id: 'plastic' }),
          h(CS.Submit, null, 'Odeslat'),
        ),
    )

    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )
    expect(submitBtn).not.toBeNull()
    expect(submitBtn!.disabled).toBe(true)
  })

  it('works within Assessment', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          A.Root,
          { id: 'quiz', passThreshold: 0.5 },
          h(
            CS.Root,
            { id: 'cs1', categories, items } as any,
            h(ContextCapture, null),
            h(CS.Item, { id: 'bottle' }),
            h(CS.Item, { id: 'newspaper' }),
            h(CS.Item, { id: 'jar' }),
            h(CS.Category, { id: 'plastic' }),
            h(CS.Category, { id: 'paper' }),
            h(CS.Category, { id: 'glass' }),
          ),
          h(A.Submit, null, 'Odeslat'),
        ),
    )

    await flushEffects()

    assignItems([['bottle', 'plastic'], ['newspaper', 'paper'], ['jar', 'glass']], rerender)
    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    expect(runtime.state.score).toBe(1)
    expect(runtime.state.passed).toBe(true)
  })

  it('records interaction on submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items } as any,
          h(ContextCapture, null),
          h(CS.Item, { id: 'bottle' }),
          h(CS.Item, { id: 'newspaper' }),
          h(CS.Item, { id: 'jar' }),
          h(CS.Category, { id: 'plastic' }),
          h(CS.Category, { id: 'paper' }),
          h(CS.Category, { id: 'glass' }),
          h(CS.Submit, null, 'Odeslat'),
        ),
    )

    await flushEffects()

    assignItems([['bottle', 'plastic'], ['newspaper', 'paper'], ['jar', 'glass']], rerender)
    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    expect(adapter.interactions.length).toBe(1)
    const interaction = adapter.interactions[0]
    expect(interaction.id).toBe('cs1')
    expect(interaction.type).toBe('matching')
    expect(interaction.result).toBe('correct')
  })

  it('marks completion on submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items } as any,
          h(ContextCapture, null),
          h(CS.Item, { id: 'bottle' }),
          h(CS.Item, { id: 'newspaper' }),
          h(CS.Item, { id: 'jar' }),
          h(CS.Category, { id: 'plastic' }),
          h(CS.Category, { id: 'paper' }),
          h(CS.Category, { id: 'glass' }),
          h(CS.Submit, null, 'Odeslat'),
        ),
    )

    await flushEffects()
    expect(runtime.isComplete('cs1')).toBe(false)

    assignItems([['bottle', 'plastic'], ['newspaper', 'paper'], ['jar', 'glass']], rerender)
    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    expect(runtime.isComplete('cs1')).toBe(true)
  })

  it('has ARIA attributes for accessibility', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items, 'aria-label': 'Waste sorting' } as any,
          h(CS.Item, { id: 'bottle' }),
          h(CS.Category, { id: 'plastic' }),
        ),
    )

    await flushEffects()

    const fieldset = container.getElementsByTagName('fieldset')[0]
    expect(fieldset.getAttribute('aria-label')).toBe('Waste sorting')

    const item = container.querySelector('[data-item="bottle"]') as HTMLElement
    expect(item.getAttribute('role')).toBe('listitem')

    const category = container.querySelector('[data-category="plastic"]') as HTMLElement
    expect(category.getAttribute('aria-label')).toContain('Plast')
  })

  it('submit button hidden after submission', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items } as any,
          h(ContextCapture, null),
          h(CS.Item, { id: 'bottle' }),
          h(CS.Item, { id: 'newspaper' }),
          h(CS.Item, { id: 'jar' }),
          h(CS.Category, { id: 'plastic' }),
          h(CS.Category, { id: 'paper' }),
          h(CS.Category, { id: 'glass' }),
          h(CS.Submit, null, 'Odeslat'),
        ),
    )

    await flushEffects()

    assignItems([['bottle', 'plastic'], ['newspaper', 'paper'], ['jar', 'glass']], rerender)
    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const submitBtns = Array.from(container.getElementsByTagName('button')).filter(
      b => b.textContent?.includes('Odeslat'),
    )
    expect(submitBtns.length).toBe(0)
  })

  it('items not draggable after submission', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items } as any,
          h(ContextCapture, null),
          h(CS.Item, { id: 'bottle' }),
          h(CS.Item, { id: 'newspaper' }),
          h(CS.Item, { id: 'jar' }),
          h(CS.Category, { id: 'plastic' }),
          h(CS.Category, { id: 'paper' }),
          h(CS.Category, { id: 'glass' }),
          h(CS.Submit, null, 'Odeslat'),
        ),
    )

    await flushEffects()

    assignItems([['bottle', 'plastic'], ['newspaper', 'paper'], ['jar', 'glass']], rerender)
    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const item = container.querySelector('[data-item="bottle"]') as HTMLElement
    // After submission, draggable should be false or not set
    const draggable = item.getAttribute('draggable')
    expect(draggable !== 'true').toBe(true)
  })

  it('resets on assessment retry', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          A.Root,
          { id: 'quiz', passThreshold: 1, maxAttempts: 3 },
          h(
            CS.Root,
            { id: 'cs1', categories, items } as any,
            h(ContextCapture, null),
            h(CS.Item, { id: 'bottle' }),
            h(CS.Item, { id: 'newspaper' }),
            h(CS.Item, { id: 'jar' }),
            h(CS.Category, { id: 'plastic' }),
            h(CS.Category, { id: 'paper' }),
            h(CS.Category, { id: 'glass' }),
          ),
          h(A.Submit, null, 'Odeslat'),
          h(A.Retry, null, 'Zkusit znovu'),
        ),
    )

    await flushEffects()

    // Assign all wrong
    assignItems([['bottle', 'paper'], ['newspaper', 'glass'], ['jar', 'plastic']], rerender)
    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    expect(runtime.state.passed).toBe(false)

    const retryBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Zkusit'),
    )
    expect(retryBtn).not.toBeNull()
    retryBtn!.click()
    rerender()
    await flushEffects()

    // Items should be draggable again
    const item = container.querySelector('[data-item="bottle"]') as HTMLElement
    expect(item.getAttribute('draggable')).toBe('true')
  })

  it('category shows assigned items with correctness after submit', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime, adapter)

    const { container, rerender } = renderWithContext(
      ctx,
      () =>
        h(
          CS.Root,
          { id: 'cs1', categories, items } as any,
          h(ContextCapture, null),
          h(CS.Item, { id: 'bottle' }),
          h(CS.Item, { id: 'newspaper' }),
          h(CS.Item, { id: 'jar' }),
          h(CS.Category, { id: 'plastic' }),
          h(CS.Category, { id: 'paper' }),
          h(CS.Category, { id: 'glass' }),
          h(CS.Submit, null, 'Odeslat'),
        ),
    )

    await flushEffects()

    // bottle -> plastic (correct), newspaper -> plastic (wrong)
    assignItems([['bottle', 'plastic'], ['newspaper', 'plastic'], ['jar', 'glass']], rerender)
    await flushEffects()

    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat'),
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    // In plastic category, bottle should be correct, newspaper wrong
    const plasticCat = container.querySelector('[data-category="plastic"]') as HTMLElement
    const catItems = plasticCat.querySelectorAll('[data-item]')
    expect(catItems.length).toBe(2)

    const bottleInCat = plasticCat.querySelector('[data-item="bottle"]') as HTMLElement
    expect(bottleInCat.getAttribute('data-correct')).toBe('true')

    const newspaperInCat = plasticCat.querySelector('[data-item="newspaper"]') as HTMLElement
    expect(newspaperInCat.getAttribute('data-correct')).toBe('false')
  })
})

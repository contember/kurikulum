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
import { useContext } from 'preact/hooks'
import type { CourseConfig, DeliveryAdapter, CourseRuntime } from '@kurikulum/core'
import {
  CourseContext,
  createNotifier,
  createCourseRuntime,
  Ordering as O,
  OrderingContext,
  OrderingItemContext,
} from '@kurikulum/core'
import type { CourseContextValue, OrderingContextValue, OrderingItemContextValue } from '@kurikulum/core'
import { Ordering, OrderingItem } from '../../template/src/components/Ordering.tsx'

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

/** Capture ordering context for programmatic testing */
let capturedCtx: OrderingContextValue | null = null
function ContextCapture() {
  capturedCtx = useContext(OrderingContext)
  return null
}

describe('Ordering DnD', () => {
  it('items have draggable attribute by default', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
      ),
    )

    await flushEffects()

    const items = getOrderedItems(container)
    for (const item of items) {
      expect(item.el.getAttribute('draggable')).toBe('true')
    }
  })

  it('dragEnabled=false disables draggable attribute', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:', dragEnabled: false },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
      ),
    )

    await flushEffects()

    const items = getOrderedItems(container)
    for (const item of items) {
      const draggable = item.el.getAttribute('draggable')
      expect(draggable !== 'true').toBe(true)
    }
  })

  it('items have role=listitem for a11y', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container } = renderWithContext(ctx, () =>
      h(Ordering, { id: 'q1', question: 'Sort:' },
        h(OrderingItem, { order: 0 }, 'A'),
        h(OrderingItem, { order: 1 }, 'B'),
      ),
    )

    await flushEffects()

    const items = getOrderedItems(container)
    for (const item of items) {
      expect(item.el.getAttribute('role')).toBe('listitem')
    }
  })

  it('moveToPosition reorders items correctly', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const { container, rerender } = renderWithContext(ctx, () =>
      h(O.Root, { id: 'q1', 'aria-label': 'Sort' },
        h(ContextCapture, null),
        h(O.List, null,
          h(O.Item, { order: 0 }, 'A'),
          h(O.Item, { order: 1 }, 'B'),
          h(O.Item, { order: 2 }, 'C'),
        ),
      ),
    )

    await flushEffects()

    const initialTexts = getItemTexts(container)

    // Move first item to last position
    capturedCtx!.moveToPosition(0, 2)
    rerender()
    await flushEffects()

    const afterTexts = getItemTexts(container)
    // First item should now be at end
    expect(afterTexts[2]).toBe(initialTexts[0])
    expect(afterTexts[0]).toBe(initialTexts[1])
    expect(afterTexts[1]).toBe(initialTexts[2])
  })

  it('DnD context values exposed in OrderingItemContext', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    let itemCtx: OrderingItemContextValue | null = null
    function CaptureItemCtx() {
      itemCtx = useContext(OrderingItemContext)
      return null
    }

    const { container } = renderWithContext(ctx, () =>
      h(O.Root, { id: 'q1', 'aria-label': 'Sort' },
        h(O.List, null,
          h(O.Item, { order: 0 },
            h(CaptureItemCtx, null),
            'A',
          ),
          h(O.Item, { order: 1 }, 'B'),
        ),
      ),
    )

    await flushEffects()

    expect(itemCtx).not.toBeNull()
    expect(itemCtx!.dragEnabled).toBe(true)
    expect(itemCtx!.isDragging).toBe(false)
    expect(itemCtx!.isDragOver).toBe(false)
    expect(itemCtx!.dragHandlers).toBeDefined()
    expect(typeof itemCtx!.dragHandlers.onDragStart).toBe('function')
    expect(typeof itemCtx!.dragHandlers.onDrop).toBe('function')
    expect(typeof itemCtx!.dragHandlers.onTouchStart).toBe('function')
    expect(typeof itemCtx!.dragHandlers.onTouchMove).toBe('function')
    expect(typeof itemCtx!.dragHandlers.onTouchEnd).toBe('function')
  })

  it('arrow buttons still work as fallback alongside DnD', async () => {
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

    // Click move down on first item
    const items = getOrderedItems(container)
    const downBtn = items[0].el.querySelector('[aria-label="Move down"]') as HTMLButtonElement
    downBtn.click()
    rerender()
    await flushEffects()

    const afterTexts = getItemTexts(container)
    expect(afterTexts[0]).toBe(initialTexts[1])
    expect(afterTexts[1]).toBe(initialTexts[0])
  })

  it('dragging disabled after submit', async () => {
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

    // Submit
    const submitBtn = Array.from(container.getElementsByTagName('button')).find(
      b => b.textContent?.includes('Odeslat')
    )!
    submitBtn.click()
    rerender()
    await flushEffects()

    const items = getOrderedItems(container)
    for (const item of items) {
      const draggable = item.el.getAttribute('draggable')
      expect(draggable !== 'true').toBe(true)
    }
  })
})

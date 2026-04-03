import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { describe, it, expect, beforeEach } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import type { CourseRuntime, CourseConfig, DeliveryAdapter } from '../../types.ts'
import { createCourseRuntime } from '../../runtime.ts'
import { CourseContext, createNotifier } from '../../context.tsx'
import type { CourseContextValue } from '../../context.tsx'
import { Notes } from './index.ts'
import { useNotes } from '../../hooks/useNotes.ts'
import { MAX_NOTEPAD_LENGTH } from './context.ts'

function createMockAdapter(): DeliveryAdapter & { committed: number; suspendData: string; location: string } {
  return {
    committed: 0,
    suspendData: '',
    location: '',
    async initialize() {},
    commit() { this.committed++ },
    setSuspendData(data: string) { this.suspendData = data },
    getSuspendData() { return this.suspendData || null },
    setScore() {},
    setStatus() {},
    setLocation(pageId: string) { this.location = pageId },
    getLocation() { return this.location || null },
    setSessionTime() {},
    recordInteraction() {},
    terminate() {},
  }
}

const config: CourseConfig = {
  title: 'Test Course',
  pages: ['page-1', 'page-2', 'page-3'],
  defaultCompletion: 'manual',
}

function createTestContext(runtime: CourseRuntime): CourseContextValue & { notify: () => void } {
  const { subscribe, notify } = createNotifier()
  const pageConditions: Record<string, () => boolean> = {}
  return {
    runtime,
    adapter: createMockAdapter(),
    subscribe,
    notify,
    defaultCompletion: config.defaultCompletion ?? 'mount',
    pageConditions,
    getVisiblePages() {
      return runtime.state.pages.filter(id => {
        const cond = pageConditions[id]
        return cond ? cond() : true
      })
    },
    restoreInfo: { restored: false, storedPage: null },
    restoreDismissed: false,
    dismissRestore() { notify() },
  }
}

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

function findByRole(container: HTMLElement, role: string): HTMLElement | null {
  const all = container.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) {
    if (all[i].getAttribute('role') === role) return all[i] as HTMLElement
  }
  return null
}

describe('Notes.Root', () => {
  let container: HTMLElement
  let adapter: ReturnType<typeof createMockAdapter>
  let runtime: CourseRuntime
  let ctx: ReturnType<typeof createTestContext>

  beforeEach(() => {
    container = document.createElement('div')
    adapter = createMockAdapter()
    runtime = createCourseRuntime(config, adapter)
    ctx = createTestContext(runtime)
  })

  it('renders children', () => {
    render(
      h(CourseContext.Provider, { value: ctx },
        h(Notes.Root, null,
          h('span', null, 'Hello'),
        ),
      ),
      container,
    )
    expect(container.getElementsByTagName('span').length).toBe(1)
    expect(container.getElementsByTagName('span')[0].textContent).toBe('Hello')
  })

  it('provides notepad context via useNotes', () => {
    let captured: ReturnType<typeof useNotes> | null = null
    function Capture() {
      captured = useNotes()
      return null
    }

    render(
      h(CourseContext.Provider, { value: ctx },
        h(Notes.Root, null,
          h(Capture, null),
        ),
      ),
      container,
    )

    expect(captured).not.toBeNull()
    expect(captured!.text).toBe('')
    expect(typeof captured!.setText).toBe('function')
  })

  it('sets notepad text', async () => {
    let captured: ReturnType<typeof useNotes> | null = null
    function Capture() {
      captured = useNotes()
      return null
    }

    const tree = h(CourseContext.Provider, { value: ctx },
      h(Notes.Root, null,
        h(Capture, null),
      ),
    )

    render(tree, container)
    captured!.setText('My notes')
    await flushEffects()
    render(tree, container)

    expect(captured!.text).toBe('My notes')
  })

  it('truncates text exceeding max length', async () => {
    let captured: ReturnType<typeof useNotes> | null = null
    function Capture() {
      captured = useNotes()
      return null
    }

    const tree = h(CourseContext.Provider, { value: ctx },
      h(Notes.Root, null,
        h(Capture, null),
      ),
    )

    render(tree, container)
    const longText = 'a'.repeat(MAX_NOTEPAD_LENGTH + 500)
    captured!.setText(longText)
    await flushEffects()
    render(tree, container)

    expect(captured!.text).toHaveLength(MAX_NOTEPAD_LENGTH)
  })

  it('syncs notepad to runtime state', async () => {
    let captured: ReturnType<typeof useNotes> | null = null
    function Capture() {
      captured = useNotes()
      return null
    }

    const tree = h(CourseContext.Provider, { value: ctx },
      h(Notes.Root, null,
        h(Capture, null),
      ),
    )

    render(tree, container)
    captured!.setText('Persisted text')
    await flushEffects()
    render(tree, container)

    expect(runtime.state.notepad).toBe('Persisted text')
  })

  it('persists and restores notepad via suspend/restore', async () => {
    let captured: ReturnType<typeof useNotes> | null = null
    function Capture() {
      captured = useNotes()
      return null
    }

    const tree = h(CourseContext.Provider, { value: ctx },
      h(Notes.Root, null,
        h(Capture, null),
      ),
    )

    render(tree, container)
    captured!.setText('Survives restart')
    await flushEffects()
    render(tree, container)

    runtime.suspend()
    const savedData = adapter.suspendData

    const adapter2 = createMockAdapter()
    adapter2.suspendData = savedData
    const runtime2 = createCourseRuntime(config, adapter2)
    runtime2.restore()

    expect(runtime2.state.notepad).toBe('Survives restart')
  })
})

describe('Notes.Panel', () => {
  let container: HTMLElement
  let runtime: CourseRuntime
  let ctx: ReturnType<typeof createTestContext>

  beforeEach(() => {
    container = document.createElement('div')
    const adapter = createMockAdapter()
    runtime = createCourseRuntime(config, adapter)
    ctx = createTestContext(runtime)
  })

  it('throws outside Notes.Root', () => {
    expect(() => {
      render(h(Notes.Panel, null), container)
    }).toThrow('Notes.Panel must be used within Notes.Root')
  })

  it('is hidden when closed', () => {
    render(
      h(CourseContext.Provider, { value: ctx },
        h(Notes.Root, null,
          h(Notes.Panel, null),
        ),
      ),
      container,
    )
    const dialog = findByRole(container, 'dialog')
    expect(dialog).toBeNull()
  })

  it('shows when opened', async () => {
    let openFn: (() => void) | null = null
    function Opener() {
      const n = useNotes()
      openFn = n.open
      return null
    }

    render(
      h(CourseContext.Provider, { value: ctx },
        h(Notes.Root, null,
          h(Opener, null),
          h(Notes.Panel, null),
        ),
      ),
      container,
    )

    openFn!()
    await flushEffects()

    render(
      h(CourseContext.Provider, { value: ctx },
        h(Notes.Root, null,
          h(Opener, null),
          h(Notes.Panel, null),
        ),
      ),
      container,
    )

    const dialog = findByRole(container, 'dialog')
    expect(dialog).not.toBeNull()
    expect(dialog!.getAttribute('aria-label')).toBe('Notes')
  })
})

describe('useNotes hook', () => {
  it('throws outside Notes.Root', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() { useNotes(); return null }
      render(h(Bad, null), container)
    }).toThrow('useNotes must be used within a Notes.Root')
  })
})

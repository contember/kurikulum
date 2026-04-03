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
import { MAX_NOTE_LENGTH, MAX_NOTES_COUNT } from './context.ts'

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

  it('provides notes context via useNotes', () => {
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
    expect(captured!.notes).toHaveLength(0)
    expect(typeof captured!.addNote).toBe('function')
    expect(typeof captured!.removeNote).toBe('function')
    expect(typeof captured!.updateNote).toBe('function')
    expect(typeof captured!.getNotesForPage).toBe('function')
  })

  it('adds a note', async () => {
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
    captured!.addNote('page-1', 'My note')
    await flushEffects()
    render(tree, container)

    expect(captured!.notes).toHaveLength(1)
    expect(captured!.notes[0].pageId).toBe('page-1')
    expect(captured!.notes[0].text).toBe('My note')
    expect(captured!.notes[0].createdAt).toBeGreaterThan(0)
  })

  it('removes a note', async () => {
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
    captured!.addNote('page-1', 'Note A')
    await flushEffects()
    render(tree, container)

    captured!.addNote('page-1', 'Note B')
    await flushEffects()
    render(tree, container)

    expect(captured!.notes).toHaveLength(2)

    captured!.removeNote('page-1', 0)
    await flushEffects()
    render(tree, container)

    expect(captured!.notes).toHaveLength(1)
    expect(captured!.notes[0].text).toBe('Note B')
  })

  it('updates a note', async () => {
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
    captured!.addNote('page-1', 'Original')
    await flushEffects()
    render(tree, container)

    captured!.updateNote('page-1', 0, 'Updated')
    await flushEffects()
    render(tree, container)

    expect(captured!.notes).toHaveLength(1)
    expect(captured!.notes[0].text).toBe('Updated')
  })

  it('filters notes by page', async () => {
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
    captured!.addNote('page-1', 'Note on page 1')
    await flushEffects()
    render(tree, container)

    captured!.addNote('page-2', 'Note on page 2')
    await flushEffects()
    render(tree, container)

    expect(captured!.getNotesForPage('page-1')).toHaveLength(1)
    expect(captured!.getNotesForPage('page-2')).toHaveLength(1)
    expect(captured!.getNotesForPage('page-3')).toHaveLength(0)
  })

  it('truncates notes exceeding max length', async () => {
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
    const longText = 'a'.repeat(300)
    captured!.addNote('page-1', longText)
    await flushEffects()
    render(tree, container)

    expect(captured!.notes[0].text).toHaveLength(MAX_NOTE_LENGTH)
  })

  it('evicts oldest note when exceeding max count', async () => {
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

    for (let i = 0; i < MAX_NOTES_COUNT + 5; i++) {
      captured!.addNote('page-1', `Note ${i}`)
      await flushEffects()
      render(tree, container)
    }

    expect(captured!.notes).toHaveLength(MAX_NOTES_COUNT)
    expect(captured!.notes[0].text).toBe('Note 5')
  })

  it('ignores empty note text', async () => {
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
    captured!.addNote('page-1', '')
    await flushEffects()
    render(tree, container)

    expect(captured!.notes).toHaveLength(0)
  })

  it('syncs notes to runtime state', async () => {
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
    captured!.addNote('page-1', 'Persisted note')
    await flushEffects()
    render(tree, container)

    expect(runtime.state.notes).toHaveLength(1)
    expect(runtime.state.notes[0].text).toBe('Persisted note')
  })

  it('persists and restores notes via suspend/restore', async () => {
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
    captured!.addNote('page-1', 'Survives restart')
    await flushEffects()
    render(tree, container)

    // Suspend saves to adapter
    runtime.suspend()
    const savedData = adapter.suspendData

    // Create new runtime and restore
    const adapter2 = createMockAdapter()
    adapter2.suspendData = savedData
    const runtime2 = createCourseRuntime(config, adapter2)
    runtime2.restore()

    expect(runtime2.state.notes).toHaveLength(1)
    expect(runtime2.state.notes[0].text).toBe('Survives restart')
    expect(runtime2.state.notes[0].pageId).toBe('page-1')
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

describe('Notes.Editor', () => {
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
      render(h(Notes.Editor, null), container)
    }).toThrow('Notes.Editor must be used within Notes.Root')
  })

  it('renders with render prop', () => {
    let renderCalled = false
    render(
      h(CourseContext.Provider, { value: ctx },
        h(Notes.Root, null,
          h(Notes.Editor, {
            children: ({ notes, addNote }: any) => {
              renderCalled = true
              expect(notes).toHaveLength(0)
              expect(typeof addNote).toBe('function')
              return h('span', null, 'Custom editor')
            },
          }),
        ),
      ),
      container,
    )

    expect(renderCalled).toBe(true)
    expect(container.textContent).toContain('Custom editor')
  })
})

describe('Notes.Indicator', () => {
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
      render(h(Notes.Indicator, null), container)
    }).toThrow('Notes.Indicator must be used within Notes.Root')
  })

  it('returns null when no notes for current page', () => {
    render(
      h(CourseContext.Provider, { value: ctx },
        h(Notes.Root, null,
          h(Notes.Indicator, null),
        ),
      ),
      container,
    )
    const spans = container.getElementsByTagName('span')
    expect(spans.length).toBe(0)
  })

  it('shows count when page has notes', async () => {
    let captured: ReturnType<typeof useNotes> | null = null
    function Capture() {
      captured = useNotes()
      return null
    }

    const tree = h(CourseContext.Provider, { value: ctx },
      h(Notes.Root, null,
        h(Capture, null),
        h(Notes.Indicator, null),
      ),
    )

    render(tree, container)
    captured!.addNote('page-1', 'A note')
    await flushEffects()
    render(tree, container)

    const spans = container.getElementsByTagName('span')
    expect(spans.length).toBeGreaterThanOrEqual(1)
    expect(spans[0].textContent).toBe('1')
  })

  it('supports render prop', () => {
    let hasNotes = false
    let count = 0

    render(
      h(CourseContext.Provider, { value: ctx },
        h(Notes.Root, null,
          h(Notes.Indicator, {
            children: (has: boolean, c: number) => {
              hasNotes = has
              count = c
              return h('span', null, has ? `${c} notes` : 'no notes')
            },
          }),
        ),
      ),
      container,
    )

    expect(hasNotes).toBe(false)
    expect(count).toBe(0)
    expect(container.textContent).toContain('no notes')
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

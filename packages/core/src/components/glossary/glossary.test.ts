import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { beforeEach, describe, expect, it } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import { useGlossary } from '../../hooks/useGlossary.ts'
import type { GlossaryEntry } from './context.ts'
import { Glossary } from './index.ts'

const entries: GlossaryEntry[] = [
  { term: 'BOZP', definition: 'Bezpečnost a ochrana zdraví při práci', aliases: ['bezpečnost práce'] },
  { term: 'OOP', definition: 'Osobní ochranné prostředky' },
  { term: 'PPE', definition: 'Personal protective equipment', aliases: ['protective equipment'] },
]

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

describe('Glossary.Root', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('renders children', () => {
    render(
      h(Glossary.Root, { entries }, h('span', null, 'Hello')),
      container,
    )
    expect(container.getElementsByTagName('span').length).toBe(1)
    expect(container.getElementsByTagName('span')[0].textContent).toBe('Hello')
  })

  it('provides entries via context', () => {
    let captured: GlossaryEntry[] = []
    function Capture() {
      const ctx = useGlossary()
      captured = ctx.entries
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Capture, null)),
      container,
    )

    expect(captured).toHaveLength(3)
    expect(captured[0].term).toBe('BOZP')
  })
})

describe('Glossary.Panel', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('throws outside Glossary.Root', () => {
    expect(() => {
      render(h(Glossary.Panel, null), container)
    }).toThrow('Glossary.Panel must be used within Glossary.Root')
  })

  it('is hidden when glossary is closed', () => {
    render(
      h(Glossary.Root, { entries }, h(Glossary.Panel, null)),
      container,
    )
    const dialog = findByRole(container, 'dialog')
    expect(dialog).toBeNull()
  })

  it('shows when glossary is opened', async () => {
    let openFn: (() => void) | null = null
    function Opener() {
      const ctx = useGlossary()
      openFn = ctx.open
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Opener, null), h(Glossary.Panel, null)),
      container,
    )

    openFn!()
    await flushEffects()

    const dialog = findByRole(container, 'dialog')
    expect(dialog).not.toBeNull()
    expect(dialog!.getAttribute('aria-label')).toBe('Glossary')
  })

  it('displays all entries when open', async () => {
    let openFn: (() => void) | null = null
    function Opener() {
      const ctx = useGlossary()
      openFn = ctx.open
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Opener, null), h(Glossary.Panel, null)),
      container,
    )

    openFn!()
    await flushEffects()

    const dts = container.getElementsByTagName('dt')
    expect(dts.length).toBe(3)
    expect(dts[0].textContent).toBe('BOZP')
    expect(dts[1].textContent).toBe('OOP')
    expect(dts[2].textContent).toBe('PPE')
  })
})

describe('Glossary.Term', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('throws outside Glossary.Root', () => {
    expect(() => {
      render(h(Glossary.Term, { term: 'BOZP' }), container)
    }).toThrow('Glossary.Term must be used within Glossary.Root')
  })

  it('renders term text', () => {
    render(
      h(Glossary.Root, { entries }, h(Glossary.Term, { term: 'BOZP' })),
      container,
    )
    const spans = container.getElementsByTagName('span')
    expect(spans.length).toBeGreaterThanOrEqual(1)
    expect(spans[0].textContent).toContain('BOZP')
  })

  it('renders custom children', () => {
    render(
      h(Glossary.Root, { entries }, h(Glossary.Term, { term: 'BOZP' }, 'Custom text')),
      container,
    )
    const spans = container.getElementsByTagName('span')
    expect(spans[0].textContent).toContain('Custom text')
  })

  it('is keyboard accessible with role="button" and tabIndex', () => {
    render(
      h(Glossary.Root, { entries }, h(Glossary.Term, { term: 'BOZP' })),
      container,
    )
    const btn = findByRole(container, 'button')
    expect(btn).not.toBeNull()
    expect(btn!.getAttribute('tabindex')).toBe('0')
  })

  it('renders as plain span for unknown term', () => {
    render(
      h(Glossary.Root, { entries }, h(Glossary.Term, { term: 'Unknown' })),
      container,
    )
    const btn = findByRole(container, 'button')
    expect(btn).toBeNull()
    expect(container.textContent).toContain('Unknown')
  })
})

describe('Glossary.Search', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('throws outside Glossary.Root', () => {
    expect(() => {
      render(h(Glossary.Search, null), container)
    }).toThrow('Glossary.Search must be used within Glossary.Root')
  })

  it('renders search input with aria-label', () => {
    render(
      h(Glossary.Root, { entries }, h(Glossary.Search, null)),
      container,
    )
    const inputs = Array.from(container.getElementsByTagName('input')) as HTMLInputElement[]
    const searchInput = inputs.find(el => el.getAttribute('aria-label') === 'Search glossary')
    expect(searchInput).not.toBeUndefined()
    expect(searchInput!.type).toBe('search')
  })
})

describe('useGlossary hook', () => {
  it('throws outside Glossary.Root', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() {
        useGlossary()
        return null
      }
      render(h(Bad, null), container)
    }).toThrow('useGlossary must be used within a Glossary.Root')
  })

  it('returns glossary context within Glossary.Root', () => {
    const container = document.createElement('div')
    let glossaryCtx: ReturnType<typeof useGlossary> | null = null

    function Capture() {
      glossaryCtx = useGlossary()
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Capture, null)),
      container,
    )

    expect(glossaryCtx).not.toBeNull()
    expect(glossaryCtx!.entries).toHaveLength(3)
    expect(glossaryCtx!.isOpen).toBe(false)
    expect(typeof glossaryCtx!.open).toBe('function')
    expect(typeof glossaryCtx!.close).toBe('function')
    expect(typeof glossaryCtx!.toggle).toBe('function')
    expect(typeof glossaryCtx!.search).toBe('function')
  })

  it('search filters by term', () => {
    const container = document.createElement('div')
    let glossaryCtx: ReturnType<typeof useGlossary> | null = null

    function Capture() {
      glossaryCtx = useGlossary()
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Capture, null)),
      container,
    )

    const results = glossaryCtx!.search('BOZP')
    expect(results).toHaveLength(1)
    expect(results[0].term).toBe('BOZP')
  })

  it('search filters by alias', () => {
    const container = document.createElement('div')
    let glossaryCtx: ReturnType<typeof useGlossary> | null = null

    function Capture() {
      glossaryCtx = useGlossary()
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Capture, null)),
      container,
    )

    const results = glossaryCtx!.search('bezpečnost práce')
    expect(results).toHaveLength(1)
    expect(results[0].term).toBe('BOZP')
  })

  it('search filters by definition', () => {
    const container = document.createElement('div')
    let glossaryCtx: ReturnType<typeof useGlossary> | null = null

    function Capture() {
      glossaryCtx = useGlossary()
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Capture, null)),
      container,
    )

    const results = glossaryCtx!.search('protective')
    expect(results).toHaveLength(1)
    expect(results[0].term).toBe('PPE')
  })

  it('search returns all entries for empty query', () => {
    const container = document.createElement('div')
    let glossaryCtx: ReturnType<typeof useGlossary> | null = null

    function Capture() {
      glossaryCtx = useGlossary()
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Capture, null)),
      container,
    )

    const results = glossaryCtx!.search('')
    expect(results).toHaveLength(3)
  })

  it('search is case-insensitive', () => {
    const container = document.createElement('div')
    let glossaryCtx: ReturnType<typeof useGlossary> | null = null

    function Capture() {
      glossaryCtx = useGlossary()
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Capture, null)),
      container,
    )

    const results = glossaryCtx!.search('bozp')
    expect(results).toHaveLength(1)
    expect(results[0].term).toBe('BOZP')
  })

  it('toggle opens and closes', async () => {
    const container = document.createElement('div')
    let glossaryCtx: ReturnType<typeof useGlossary> | null = null

    function Capture() {
      glossaryCtx = useGlossary()
      return null
    }

    render(
      h(Glossary.Root, { entries }, h(Capture, null)),
      container,
    )

    expect(glossaryCtx!.isOpen).toBe(false)
    glossaryCtx!.toggle()
    await flushEffects()

    // Re-capture after state update
    render(
      h(Glossary.Root, { entries }, h(Capture, null)),
      container,
    )

    expect(glossaryCtx!.isOpen).toBe(true)
  })
})

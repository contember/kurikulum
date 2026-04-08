import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { beforeEach, describe, expect, it } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import { useSearch } from '../../hooks/useSearch.ts'
import type { SearchContextValue, SearchEntry } from './context.ts'
import { Search } from './index.ts'
import { extractSnippet, normalize, searchEntries } from './search-engine.ts'

const index: SearchEntry[] = [
  { pageId: 'intro', title: 'Úvod do kurzu', content: 'Vítejte v kurzu zaměřeném na bezpečnost webových aplikací.' },
  {
    pageId: 'theory',
    title: 'Nejčastější zranitelnosti',
    content: 'XSS umožňuje útočníkovi vložit škodlivý skript do stránky. SQL Injection je další hrozba.',
  },
  {
    pageId: 'summary',
    title: 'Shrnutí',
    content: 'V tomto kurzu jste se naučili rozpoznat a bránit se proti útokům.',
    keywords: ['bezpečnost', 'OWASP'],
  },
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

// --- search-engine unit tests ---

describe('normalize', () => {
  it('lowercases text', () => {
    expect(normalize('Hello World')).toBe('hello world')
  })

  it('removes diacritics', () => {
    expect(normalize('Příliš žluťoučký')).toBe('prilis zlutoucky')
  })

  it('handles combined diacritics and case', () => {
    expect(normalize('Úvod')).toBe('uvod')
  })
})

describe('extractSnippet', () => {
  it('returns snippet around match', () => {
    const text = 'This is a long text about security and web applications and many other things that go on and on.'
    const snippet = extractSnippet(text, 'security')
    expect(snippet).toContain('security')
  })

  it('returns beginning of text when no match', () => {
    const text = 'Short text here.'
    const snippet = extractSnippet(text, 'nonexistent')
    expect(snippet).toBe('Short text here.')
  })

  it('adds ellipsis for long texts with no match', () => {
    const text = 'A'.repeat(200)
    const snippet = extractSnippet(text, 'nonexistent')
    expect(snippet.endsWith('...')).toBe(true)
    expect(snippet.length).toBeLessThan(200)
  })
})

describe('searchEntries', () => {
  it('returns empty array for empty query', () => {
    expect(searchEntries(index, '')).toHaveLength(0)
    expect(searchEntries(index, '   ')).toHaveLength(0)
  })

  it('finds by title', () => {
    const results = searchEntries(index, 'Úvod')
    expect(results).toHaveLength(1)
    expect(results[0].pageId).toBe('intro')
  })

  it('finds by content', () => {
    const results = searchEntries(index, 'XSS')
    expect(results).toHaveLength(1)
    expect(results[0].pageId).toBe('theory')
  })

  it('finds by keywords', () => {
    const results = searchEntries(index, 'OWASP')
    expect(results).toHaveLength(1)
    expect(results[0].pageId).toBe('summary')
  })

  it('is case-insensitive', () => {
    const results = searchEntries(index, 'xss')
    expect(results).toHaveLength(1)
    expect(results[0].pageId).toBe('theory')
  })

  it('is diacritics-insensitive', () => {
    const results = searchEntries(index, 'uvod')
    expect(results).toHaveLength(1)
    expect(results[0].pageId).toBe('intro')
  })

  it('returns snippet with context', () => {
    const results = searchEntries(index, 'XSS')
    expect(results[0].snippet).toContain('XSS')
  })

  it('finds multiple matches', () => {
    const results = searchEntries(index, 'kurzu')
    expect(results.length).toBeGreaterThanOrEqual(2)
  })
})

// --- Component tests ---

describe('Search.Root', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('renders children', () => {
    render(
      h(Search.Root, { index }, h('span', null, 'Hello')),
      container,
    )
    expect(container.getElementsByTagName('span').length).toBe(1)
    expect(container.getElementsByTagName('span')[0].textContent).toBe('Hello')
  })

  it('provides context via useSearch', () => {
    let captured: SearchContextValue | null = null
    function Capture() {
      captured = useSearch()
      return null
    }

    render(
      h(Search.Root, { index }, h(Capture, null)),
      container,
    )

    expect(captured).not.toBeNull()
    expect(captured!.query).toBe('')
    expect(captured!.results).toHaveLength(0)
    expect(captured!.isOpen).toBe(false)
    expect(typeof captured!.open).toBe('function')
    expect(typeof captured!.close).toBe('function')
    expect(typeof captured!.setQuery).toBe('function')
    expect(typeof captured!.navigateTo).toBe('function')
  })
})

describe('Search.Input', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('throws outside Search.Root', () => {
    expect(() => {
      render(h(Search.Input, null), container)
    }).toThrow('Search.Input must be used within Search.Root')
  })

  it('renders search input with aria-label', () => {
    render(
      h(Search.Root, { index }, h(Search.Input, null)),
      container,
    )
    const inputs = Array.from(container.getElementsByTagName('input')) as HTMLInputElement[]
    const searchInput = inputs.find(el => el.getAttribute('aria-label') === 'Search course content')
    expect(searchInput).not.toBeUndefined()
    expect(searchInput!.type).toBe('search')
  })
})

describe('Search.Results', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('throws outside Search.Root', () => {
    expect(() => {
      render(h(Search.Results, null), container)
    }).toThrow('Search.Results must be used within Search.Root')
  })

  it('is hidden when search is closed', () => {
    render(
      h(Search.Root, { index }, h(Search.Results, null)),
      container,
    )
    const listbox = findByRole(container, 'listbox')
    expect(listbox).toBeNull()
  })

  it('shows when search is opened with results', async () => {
    let ctx: SearchContextValue | null = null
    function Controller() {
      ctx = useSearch()
      return null
    }

    render(
      h(Search.Root, { index }, h(Controller, null), h(Search.Results, null)),
      container,
    )

    ctx!.open()
    ctx!.setQuery('XSS')
    await flushEffects()

    // Re-render to capture state changes
    render(
      h(Search.Root, { index }, h(Controller, null), h(Search.Results, null)),
      container,
    )

    await flushEffects()

    const listbox = findByRole(container, 'listbox')
    expect(listbox).not.toBeNull()
  })
})

describe('Search.Result', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('throws outside Search.Root', () => {
    expect(() => {
      render(h(Search.Result, { pageId: 'intro' }, 'Test'), container)
    }).toThrow('Search.Result must be used within Search.Root')
  })

  it('renders with role option', () => {
    render(
      h(Search.Root, { index }, h(Search.Result, { pageId: 'intro' }, 'Result text')),
      container,
    )
    const option = findByRole(container, 'option')
    expect(option).not.toBeNull()
    expect(option!.textContent).toBe('Result text')
  })
})

describe('useSearch hook', () => {
  it('throws outside Search.Root', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() {
        useSearch()
        return null
      }
      render(h(Bad, null), container)
    }).toThrow('useSearch must be used within a Search.Root')
  })

  it('returns search context within Search.Root', () => {
    const container = document.createElement('div')
    let ctx: SearchContextValue | null = null

    function Capture() {
      ctx = useSearch()
      return null
    }

    render(
      h(Search.Root, { index }, h(Capture, null)),
      container,
    )

    expect(ctx).not.toBeNull()
    expect(ctx!.query).toBe('')
    expect(ctx!.isOpen).toBe(false)
    expect(ctx!.results).toHaveLength(0)
  })

  it('open and close toggle isOpen state', async () => {
    const container = document.createElement('div')
    let ctx: SearchContextValue | null = null

    function Capture() {
      ctx = useSearch()
      return null
    }

    render(
      h(Search.Root, { index }, h(Capture, null)),
      container,
    )

    expect(ctx!.isOpen).toBe(false)
    ctx!.open()
    await flushEffects()

    render(
      h(Search.Root, { index }, h(Capture, null)),
      container,
    )

    expect(ctx!.isOpen).toBe(true)

    ctx!.close()
    await flushEffects()

    render(
      h(Search.Root, { index }, h(Capture, null)),
      container,
    )

    expect(ctx!.isOpen).toBe(false)
    // close also resets query
    expect(ctx!.query).toBe('')
  })

  it('setQuery updates results', async () => {
    const container = document.createElement('div')
    let ctx: SearchContextValue | null = null

    function Capture() {
      ctx = useSearch()
      return null
    }

    render(
      h(Search.Root, { index }, h(Capture, null)),
      container,
    )

    ctx!.setQuery('XSS')
    await flushEffects()

    render(
      h(Search.Root, { index }, h(Capture, null)),
      container,
    )

    expect(ctx!.results).toHaveLength(1)
    expect(ctx!.results[0].pageId).toBe('theory')
    expect(ctx!.results[0].snippet).toContain('XSS')
  })
})

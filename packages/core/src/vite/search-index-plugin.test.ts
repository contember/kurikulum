import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { extractLocaleEntries } from './search-index-plugin.ts'

describe('extractLocaleEntries', () => {
  const tmpDir = join(import.meta.dir, '__test_tmp__')
  const localeDir = join(tmpDir, 'cs')
  const pagesDir = join(localeDir, 'pages')

  beforeEach(() => {
    mkdirSync(pagesDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeIndex(content: string) {
    writeFileSync(join(localeDir, 'index.ts'), content)
  }

  function writePage(name: string, body: string) {
    writeFileSync(join(pagesDir, `${name}.tsx`), body)
  }

  it('returns empty array when index.ts is missing', () => {
    expect(extractLocaleEntries(join(localeDir, 'index.ts'))).toEqual([])
  })

  it('extracts entries for a simple pages map', () => {
    writePage('IntroPage', `export function IntroPage() { return <><h1>Welcome</h1><p>Intro text.</p></> }`)
    writeIndex(`
      import { IntroPage } from './pages/IntroPage.tsx'
      export const pages = {
        intro: IntroPage,
      }
    `)
    const entries = extractLocaleEntries(join(localeDir, 'index.ts'))
    expect(entries).toHaveLength(1)
    expect(entries[0].pageId).toBe('intro')
    expect(entries[0].title).toBe('Welcome')
    expect(entries[0].content).toContain('Intro text')
  })

  it('handles quoted page IDs with hyphens', () => {
    writePage('QuickQuiz', `export function QuickQuiz() { return <><h1>Quiz</h1><p>Q.</p></> }`)
    writeIndex(`
      import { QuickQuiz } from './pages/QuickQuiz.tsx'
      export const pages = {
        'standalone-quiz': QuickQuiz,
      }
    `)
    const entries = extractLocaleEntries(join(localeDir, 'index.ts'))
    expect(entries).toHaveLength(1)
    expect(entries[0].pageId).toBe('standalone-quiz')
  })

  it('extracts multiple pages in source order', () => {
    writePage('A', `export function A() { return <><h1>A title</h1><p>a</p></> }`)
    writePage('B', `export function B() { return <><h1>B title</h1><p>b</p></> }`)
    writeIndex(`
      import { A } from './pages/A.tsx'
      import { B } from './pages/B.tsx'
      export const pages = {
        first: A,
        second: B,
      }
    `)
    const entries = extractLocaleEntries(join(localeDir, 'index.ts'))
    expect(entries.map(e => e.pageId)).toEqual(['first', 'second'])
    expect(entries[0].title).toBe('A title')
    expect(entries[1].title).toBe('B title')
  })

  it('strips HTML tags from extracted content', () => {
    writePage('Styled', `export function Styled() { return <><h1>Title</h1><p>Some <strong>bold</strong> text.</p></> }`)
    writeIndex(`
      import { Styled } from './pages/Styled.tsx'
      export const pages = { styled: Styled }
    `)
    const [entry] = extractLocaleEntries(join(localeDir, 'index.ts'))
    expect(entry.content).not.toContain('<strong>')
    expect(entry.content).toContain('bold')
  })

  it('falls back to pageId for title when no h1/h2 is present', () => {
    writePage('Plain', `export function Plain() { return <><p>Just text.</p></> }`)
    writeIndex(`
      import { Plain } from './pages/Plain.tsx'
      export const pages = { plain: Plain }
    `)
    const [entry] = extractLocaleEntries(join(localeDir, 'index.ts'))
    expect(entry.title).toBe('plain')
  })

  it('uses h2 when no h1 is present', () => {
    writePage('Sub', `export function Sub() { return <><h2>Subtitle</h2><p>x</p></> }`)
    writeIndex(`
      import { Sub } from './pages/Sub.tsx'
      export const pages = { sub: Sub }
    `)
    const [entry] = extractLocaleEntries(join(localeDir, 'index.ts'))
    expect(entry.title).toBe('Subtitle')
  })

  it('skips pages map entries whose components were not imported from a file path', () => {
    writeIndex(`
      export const pages = {
        ghost: NotImported,
      }
    `)
    expect(extractLocaleEntries(join(localeDir, 'index.ts'))).toHaveLength(0)
  })
})

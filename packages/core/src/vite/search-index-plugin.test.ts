import { describe, it, expect } from 'bun:test'
import { extractSearchEntries } from './search-index-plugin.ts'

describe('extractSearchEntries', () => {
  it('extracts page id and title from JSX source', () => {
    const source = `
      <Page id="intro" completion="mount">
        <h1>Welcome to the Course</h1>
        <p>This is the introduction page.</p>
      </Page>
    `
    const entries = extractSearchEntries(source)
    expect(entries).toHaveLength(1)
    expect(entries[0].pageId).toBe('intro')
    expect(entries[0].title).toBe('Welcome to the Course')
    expect(entries[0].content).toContain('introduction page')
  })

  it('extracts multiple pages', () => {
    const source = `
      <Page id="page1" completion="mount">
        <h1>First Page</h1>
        <p>Content of first page.</p>
      </Page>
      <Page id="page2" completion="timer">
        <h1>Second Page</h1>
        <p>Content of second page.</p>
      </Page>
    `
    const entries = extractSearchEntries(source)
    expect(entries).toHaveLength(2)
    expect(entries[0].pageId).toBe('page1')
    expect(entries[0].title).toBe('First Page')
    expect(entries[1].pageId).toBe('page2')
    expect(entries[1].title).toBe('Second Page')
  })

  it('strips HTML tags from content', () => {
    const source = `
      <Page id="test" completion="mount">
        <h1>Test Page</h1>
        <p>Some <strong>bold</strong> and <em>italic</em> text.</p>
      </Page>
    `
    const entries = extractSearchEntries(source)
    expect(entries[0].content).not.toContain('<strong>')
    expect(entries[0].content).not.toContain('<em>')
    expect(entries[0].content).toContain('bold')
    expect(entries[0].content).toContain('italic')
  })

  it('uses pageId as title when no h1/h2 found', () => {
    const source = `
      <Page id="no-title" completion="mount">
        <p>Just some content without a heading.</p>
      </Page>
    `
    const entries = extractSearchEntries(source)
    expect(entries[0].title).toBe('no-title')
  })

  it('extracts title from h2 when no h1', () => {
    const source = `
      <Page id="h2-page" completion="mount">
        <h2>Section Title</h2>
        <p>Content here.</p>
      </Page>
    `
    const entries = extractSearchEntries(source)
    expect(entries[0].title).toBe('Section Title')
  })

  it('returns empty array for source without Page components', () => {
    const source = `
      <div>
        <h1>Not a page</h1>
        <p>Regular content.</p>
      </div>
    `
    const entries = extractSearchEntries(source)
    expect(entries).toHaveLength(0)
  })

  it('handles single-quoted id attributes', () => {
    const source = `
      <Page id='quoted' completion="mount">
        <h1>Quoted Page</h1>
        <p>Content.</p>
      </Page>
    `
    const entries = extractSearchEntries(source)
    expect(entries).toHaveLength(1)
    expect(entries[0].pageId).toBe('quoted')
  })
})

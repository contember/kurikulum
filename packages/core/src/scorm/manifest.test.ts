import { describe, it, expect } from 'bun:test'
import { generateManifest } from './manifest.ts'

describe('generateManifest', () => {
  it('generates valid SCORM 1.2 manifest XML', () => {
    const xml = generateManifest({
      title: 'Test Course',
      files: ['index.html', 'assets/style.css'],
    })

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"')
    expect(xml).toContain('xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"')
    expect(xml).toContain('<schema>ADL SCORM</schema>')
    expect(xml).toContain('<schemaversion>1.2</schemaversion>')
  })

  it('includes course title in organization and item', () => {
    const xml = generateManifest({
      title: 'My Course',
      files: ['index.html'],
    })

    expect(xml).toContain('<title>My Course</title>')
    // Should appear twice: once in organization, once in item
    const titleMatches = xml.match(/<title>My Course<\/title>/g)
    expect(titleMatches).toHaveLength(2)
  })

  it('uses default identifier when not provided', () => {
    const xml = generateManifest({
      title: 'Test',
      files: ['index.html'],
    })

    expect(xml).toContain('identifier="kurikulum-course"')
  })

  it('uses custom identifier when provided', () => {
    const xml = generateManifest({
      title: 'Test',
      identifier: 'custom-id',
      files: ['index.html'],
    })

    expect(xml).toContain('identifier="custom-id"')
  })

  it('lists all files as file elements in the resource', () => {
    const xml = generateManifest({
      title: 'Test',
      files: ['index.html', 'assets/main.js', 'assets/style.css'],
    })

    expect(xml).toContain('<file href="index.html"/>')
    expect(xml).toContain('<file href="assets/main.js"/>')
    expect(xml).toContain('<file href="assets/style.css"/>')
  })

  it('sets resource href to index.html and scormtype to sco', () => {
    const xml = generateManifest({
      title: 'Test',
      files: ['index.html'],
    })

    expect(xml).toContain('href="index.html"')
    expect(xml).toContain('adlcp:scormtype="sco"')
    expect(xml).toContain('type="webcontent"')
  })

  it('escapes XML special characters in title', () => {
    const xml = generateManifest({
      title: 'Course <"A&B">',
      files: ['index.html'],
    })

    expect(xml).toContain('Course &lt;&quot;A&amp;B&quot;&gt;')
    expect(xml).not.toContain('<"A&B">')
  })
})

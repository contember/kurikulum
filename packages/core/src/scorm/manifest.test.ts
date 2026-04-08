import { describe, expect, it } from 'bun:test'
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

describe('generateManifest SCORM 2004', () => {
  it('generates valid SCORM 2004 manifest XML', () => {
    const xml = generateManifest({
      title: 'Test Course',
      files: ['index.html', 'assets/style.css'],
      scormVersion: 'scorm-2004',
    })

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"')
    expect(xml).toContain('xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"')
    expect(xml).toContain('xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"')
    expect(xml).toContain('xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"')
    expect(xml).toContain('xmlns:imsss="http://www.imsglobal.org/xsd/imsss"')
    expect(xml).toContain('<schema>ADL SCORM</schema>')
    expect(xml).toContain('<schemaversion>2004 4th Edition</schemaversion>')
  })

  it('uses scormType (camelCase) for SCORM 2004', () => {
    const xml = generateManifest({
      title: 'Test',
      files: ['index.html'],
      scormVersion: 'scorm-2004',
    })

    expect(xml).toContain('adlcp:scormType="sco"')
    expect(xml).not.toContain('adlcp:scormtype="sco"')
  })

  it('includes title in organization and item', () => {
    const xml = generateManifest({
      title: 'My SCORM 2004 Course',
      files: ['index.html'],
      scormVersion: 'scorm-2004',
    })

    const titleMatches = xml.match(/<title>My SCORM 2004 Course<\/title>/g)
    expect(titleMatches).toHaveLength(2)
  })

  it('lists all files', () => {
    const xml = generateManifest({
      title: 'Test',
      files: ['index.html', 'assets/main.js'],
      scormVersion: 'scorm-2004',
    })

    expect(xml).toContain('<file href="index.html"/>')
    expect(xml).toContain('<file href="assets/main.js"/>')
  })

  it('uses custom identifier', () => {
    const xml = generateManifest({
      title: 'Test',
      identifier: 'my-2004-course',
      files: ['index.html'],
      scormVersion: 'scorm-2004',
    })

    expect(xml).toContain('identifier="my-2004-course"')
  })

  it('escapes XML special characters', () => {
    const xml = generateManifest({
      title: 'Course <"A&B">',
      files: ['index.html'],
      scormVersion: 'scorm-2004',
    })

    expect(xml).toContain('Course &lt;&quot;A&amp;B&quot;&gt;')
  })

  it('defaults to SCORM 1.2 when scormVersion not specified', () => {
    const xml = generateManifest({
      title: 'Test',
      files: ['index.html'],
    })

    expect(xml).toContain('<schemaversion>1.2</schemaversion>')
    expect(xml).not.toContain('2004')
  })
})

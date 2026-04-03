import { describe, it, expect } from 'bun:test'
import { generateCmi5Manifest } from './manifest.ts'

describe('generateCmi5Manifest', () => {
  it('generates valid cmi5.xml with required elements', () => {
    const xml = generateCmi5Manifest({
      title: 'Safety 101',
      activityId: 'https://example.com/courses/safety-101',
      files: ['index.html', 'assets/style.css'],
    })

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<courseStructure')
    expect(xml).toContain('cmi5')
    expect(xml).toContain('course id="https://example.com/courses/safety-101"')
    expect(xml).toContain('<langstring lang="en-US">Safety 101</langstring>')
    expect(xml).toContain('launchUrl="index.html"')
    expect(xml).toContain('moveOn="CompletedOrPassed"')
  })

  it('uses custom identifier', () => {
    const xml = generateCmi5Manifest({
      title: 'My Course',
      identifier: 'my-custom-id',
      activityId: 'https://example.com/courses/custom',
      files: ['index.html'],
    })

    expect(xml).toContain('id="my-custom-id-au"')
  })

  it('uses custom launch URL', () => {
    const xml = generateCmi5Manifest({
      title: 'My Course',
      activityId: 'https://example.com/courses/custom',
      launchUrl: 'start.html',
      files: ['start.html'],
    })

    expect(xml).toContain('launchUrl="start.html"')
  })

  it('escapes XML special characters in title', () => {
    const xml = generateCmi5Manifest({
      title: 'Safety & Security <101>',
      activityId: 'https://example.com/courses/safety',
      files: ['index.html'],
    })

    expect(xml).toContain('Safety &amp; Security &lt;101&gt;')
    expect(xml).not.toContain('Safety & Security <101>')
  })

  it('escapes XML special characters in activityId', () => {
    const xml = generateCmi5Manifest({
      title: 'Course',
      activityId: 'https://example.com/courses/a&b',
      files: ['index.html'],
    })

    expect(xml).toContain('course id="https://example.com/courses/a&amp;b"')
  })

  it('uses default identifier and launch URL', () => {
    const xml = generateCmi5Manifest({
      title: 'Test',
      activityId: 'https://example.com/test',
      files: [],
    })

    expect(xml).toContain('id="tabule-course-au"')
    expect(xml).toContain('launchUrl="index.html"')
  })
})

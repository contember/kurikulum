import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import JSZip from 'jszip'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createScormPackage } from './package.ts'

describe('createScormPackage', () => {
  let tempDir: string
  let outputDir: string
  let outputZip: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'scorm-test-'))
    outputDir = join(tempDir, 'dist')
    outputZip = join(tempDir, 'course.zip')

    await mkdir(outputDir, { recursive: true })
    await mkdir(join(outputDir, 'assets'), { recursive: true })
    await writeFile(join(outputDir, 'index.html'), '<html><body>Hello</body></html>')
    await writeFile(join(outputDir, 'assets', 'style.css'), 'body { color: red; }')
    await writeFile(join(outputDir, 'assets', 'main.js'), 'console.log("hello")')
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('creates a ZIP file', async () => {
    await createScormPackage({ outputDir, outputZip, title: 'Test Course' })

    const zipBuffer = await readFile(outputZip)
    expect(zipBuffer.length).toBeGreaterThan(0)
  })

  it('ZIP contains imsmanifest.xml', async () => {
    await createScormPackage({ outputDir, outputZip, title: 'Test Course' })

    const zipBuffer = await readFile(outputZip)
    const zip = await JSZip.loadAsync(zipBuffer)
    const manifest = zip.file('imsmanifest.xml')
    expect(manifest).not.toBeNull()

    const content = await manifest!.async('string')
    expect(content).toContain('<title>Test Course</title>')
    expect(content).toContain('ADL SCORM')
    expect(content).toContain('<schemaversion>1.2</schemaversion>')
  })

  it('ZIP contains index.html and assets', async () => {
    await createScormPackage({ outputDir, outputZip, title: 'Test Course' })

    const zipBuffer = await readFile(outputZip)
    const zip = await JSZip.loadAsync(zipBuffer)

    expect(zip.file('index.html')).not.toBeNull()
    expect(zip.file('assets/style.css')).not.toBeNull()
    expect(zip.file('assets/main.js')).not.toBeNull()
  })

  it('manifest lists all build output files', async () => {
    await createScormPackage({ outputDir, outputZip, title: 'Test Course' })

    const zipBuffer = await readFile(outputZip)
    const zip = await JSZip.loadAsync(zipBuffer)
    const manifest = await zip.file('imsmanifest.xml')!.async('string')

    expect(manifest).toContain('<file href="index.html"/>')
    expect(manifest).toContain('<file href="assets/style.css"/>')
    expect(manifest).toContain('<file href="assets/main.js"/>')
  })

  it('course title appears in manifest', async () => {
    await createScormPackage({ outputDir, outputZip, title: 'My Great Course' })

    const zipBuffer = await readFile(outputZip)
    const zip = await JSZip.loadAsync(zipBuffer)
    const manifest = await zip.file('imsmanifest.xml')!.async('string')

    expect(manifest).toContain('<title>My Great Course</title>')
  })
})

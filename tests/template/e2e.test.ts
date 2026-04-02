import { describe, it, expect, beforeAll } from 'bun:test'
import { existsSync, readFileSync, rmSync } from 'fs'
import { resolve } from 'path'
import JSZip from 'jszip'

const templateDir = resolve(import.meta.dir, '../../template')
const distDir = resolve(templateDir, 'dist')

describe('E2E: Standalone build', () => {
  beforeAll(async () => {
    // Clean previous builds
    if (existsSync(resolve(distDir, 'standalone'))) {
      rmSync(resolve(distDir, 'standalone'), { recursive: true })
    }

    const proc = Bun.spawn(['bun', 'run', 'build'], {
      cwd: templateDir,
      env: { ...process.env, KURIKULUM_TARGET: 'standalone' },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const exitCode = await proc.exited
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      throw new Error(`Standalone build failed (exit ${exitCode}):\n${stderr}`)
    }
  })

  it('produces index.html in dist/standalone', () => {
    const htmlPath = resolve(distDir, 'standalone', 'index.html')
    expect(existsSync(htmlPath)).toBe(true)
  })

  it('index.html is a single-file bundle (contains inline script)', () => {
    const html = readFileSync(resolve(distDir, 'standalone', 'index.html'), 'utf-8')
    // vite-plugin-singlefile inlines JS into the HTML
    expect(html).toContain('<script')
    expect(html).toContain('</script>')
  })

  it('index.html contains course content', () => {
    const html = readFileSync(resolve(distDir, 'standalone', 'index.html'), 'utf-8')
    // The JSX string literals get bundled into the output
    expect(html).toContain('Testovac')
  })

  it('index.html contains the app mount point', () => {
    const html = readFileSync(resolve(distDir, 'standalone', 'index.html'), 'utf-8')
    expect(html).toContain('id="app"')
  })
})

describe('E2E: SCORM 1.2 build', () => {
  beforeAll(async () => {
    // Clean previous builds
    if (existsSync(resolve(distDir, 'scorm-1.2'))) {
      rmSync(resolve(distDir, 'scorm-1.2'), { recursive: true })
    }
    const zipPath = resolve(distDir, 'Course.zip')
    if (existsSync(zipPath)) {
      rmSync(zipPath)
    }

    const proc = Bun.spawn(['bun', 'run', 'build:scorm'], {
      cwd: templateDir,
      env: { ...process.env, KURIKULUM_TARGET: 'scorm-1.2' },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const exitCode = await proc.exited
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      throw new Error(`SCORM build failed (exit ${exitCode}):\n${stderr}`)
    }
  })

  it('produces index.html in dist/scorm-1.2', () => {
    const htmlPath = resolve(distDir, 'scorm-1.2', 'index.html')
    expect(existsSync(htmlPath)).toBe(true)
  })

  it('produces Course.zip', () => {
    const zipPath = resolve(distDir, 'Course.zip')
    expect(existsSync(zipPath)).toBe(true)
  })

  it('Course.zip contains imsmanifest.xml', async () => {
    const zipPath = resolve(distDir, 'Course.zip')
    const zipData = readFileSync(zipPath)
    const zip = await JSZip.loadAsync(zipData)
    expect(zip.file('imsmanifest.xml')).not.toBeNull()
  })

  it('Course.zip contains index.html', async () => {
    const zipPath = resolve(distDir, 'Course.zip')
    const zipData = readFileSync(zipPath)
    const zip = await JSZip.loadAsync(zipData)
    expect(zip.file('index.html')).not.toBeNull()
  })

  it('imsmanifest.xml has correct SCORM 1.2 structure', async () => {
    const zipPath = resolve(distDir, 'Course.zip')
    const zipData = readFileSync(zipPath)
    const zip = await JSZip.loadAsync(zipData)
    const manifest = await zip.file('imsmanifest.xml')!.async('text')

    expect(manifest).toContain('adlcp:scormtype')
    expect(manifest).toContain('index.html')
    expect(manifest).toContain('<manifest')
  })

  it('bundled HTML contains SCORM adapter code', () => {
    const html = readFileSync(resolve(distDir, 'scorm-1.2', 'index.html'), 'utf-8')
    // SCORM adapter references LMS API functions
    expect(html).toContain('LMSInitialize')
  })
})

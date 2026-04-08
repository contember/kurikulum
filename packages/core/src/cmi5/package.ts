import archiver from 'archiver'
import { createWriteStream } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { generateCmi5Manifest } from './manifest.ts'

export interface Cmi5PackageOptions {
  outputDir: string
  outputZip: string
  title: string
  activityId: string
}

async function collectFiles(dir: string, base: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, base))
    } else {
      files.push(relative(base, fullPath))
    }
  }
  return files
}

export async function createCmi5Package(options: Cmi5PackageOptions): Promise<void> {
  const { outputDir, outputZip, title, activityId } = options

  const files = await collectFiles(outputDir, outputDir)
  const manifest = generateCmi5Manifest({ title, activityId, files })

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputZip)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    archive.on('error', (err: Error) => reject(err))

    archive.pipe(output)
    archive.append(manifest, { name: 'cmi5.xml' })
    archive.directory(outputDir, false)
    archive.finalize()
  })
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('/cmi5/package.ts')) {
  const outputDir = process.argv[2] ?? 'dist'
  const title = process.argv[3] ?? 'Course'
  const activityId = process.argv[4] ?? 'https://example.com/courses/default'
  const outputZip = process.argv[5] ?? `${title}-cmi5.zip`

  createCmi5Package({ outputDir, outputZip, title, activityId })
    .then(() => console.log(`cmi5 package created: ${outputZip}`))
    .catch((err) => {
      console.error('Failed to create cmi5 package:', err)
      process.exit(1)
    })
}

import { readdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { createWriteStream } from 'node:fs'
import archiver from 'archiver'
import { generateManifest } from './manifest.ts'

export interface PackageOptions {
  outputDir: string
  outputZip: string
  title: string
  scormVersion?: 'scorm-1.2' | 'scorm-2004'
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

export async function createScormPackage(options: PackageOptions): Promise<void> {
  const { outputDir, outputZip, title } = options

  const files = await collectFiles(outputDir, outputDir)
  const manifest = generateManifest({ title, files, scormVersion: options.scormVersion })

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputZip)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    archive.on('error', (err: Error) => reject(err))

    archive.pipe(output)
    archive.append(manifest, { name: 'imsmanifest.xml' })
    archive.directory(outputDir, false)
    archive.finalize()
  })
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('/scorm/package.ts')) {
  const outputDir = process.argv[2] ?? 'dist'
  const title = process.argv[3] ?? 'Course'
  const outputZip = process.argv[4] ?? `${title}.zip`

  createScormPackage({ outputDir, outputZip, title })
    .then(() => console.log(`SCORM package created: ${outputZip}`))
    .catch((err) => {
      console.error('Failed to create SCORM package:', err)
      process.exit(1)
    })
}

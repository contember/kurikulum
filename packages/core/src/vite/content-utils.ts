import { existsSync, readdirSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'

export interface ContentDirInfo {
  /** Filesystem absolute path of the content root. */
  absolute: string
  /** Vite-rooted absolute path (forward slashes), e.g. '/src/content'. */
  rootRelative: string
  /** Locale subdirectories that contain an index.ts. */
  locales: string[]
}

export function discoverContent(viteRoot: string, contentDir: string): ContentDirInfo {
  const absolute = isAbsolute(contentDir) ? contentDir : resolve(viteRoot, contentDir)
  const rootRelative = '/' + relative(viteRoot, absolute).replace(/\\/g, '/')

  const locales = existsSync(absolute)
    ? readdirSync(absolute, { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(resolve(absolute, d.name, 'index.ts')))
      .map(d => d.name)
      .sort()
    : []

  return { absolute, rootRelative, locales }
}

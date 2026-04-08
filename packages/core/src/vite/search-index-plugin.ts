interface VitePlugin {
  name: string
  enforce?: 'pre' | 'post'
  resolveId?(id: string): string | undefined
  load?(id: string): string | undefined
  transform?(code: string, id: string): void
}

export interface SearchIndexPluginOptions {
  /**
   * Virtual module ID that will resolve to the search index JSON.
   * Default: 'virtual:search-index'
   */
  moduleId?: string
}

export interface SearchEntry {
  pageId: string
  title: string
  content: string
  keywords?: string[]
}

/**
 * Strip JSX/HTML tags from text content to produce plain text.
 */
function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Extract title and plain text content from a JSX source.
 */
function extractContent(source: string): { title: string; content: string } {
  const titleMatch = source.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/)
  const title = titleMatch ? stripTags(titleMatch[1]) : ''
  const content = stripTags(source)
  return { title, content }
}

/**
 * Parse import statements and return a map of component name to resolved file path.
 */
function parseImports(code: string, filePath: string): Map<string, string> {
  const { dirname } = require('node:path') as typeof import('path')
  const dir = dirname(filePath)
  const map = new Map<string, string>()

  // Named imports: import { Foo, Bar } from './path'
  const namedRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = namedRegex.exec(code)) !== null) {
    const names = match[1].split(',').map((n) => n.split(' as ').pop()!.trim())
    const specifier = match[2]
    for (const name of names) {
      const resolved = resolveImportPath(dir, specifier)
      if (resolved) map.set(name, resolved)
    }
  }

  // Default imports: import Foo from './path'
  const defaultRegex = /import\s+([A-Z]\w*)\s+from\s+['"]([^'"]+)['"]/g
  while ((match = defaultRegex.exec(code)) !== null) {
    const name = match[1]
    const specifier = match[2]
    const resolved = resolveImportPath(dir, specifier)
    if (resolved) map.set(name, resolved)
  }

  return map
}

function resolveImportPath(dir: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const { resolve } = require('node:path') as typeof import('path')
  const { existsSync } = require('node:fs') as typeof import('fs')
  const resolved = resolve(dir, specifier)
  if (existsSync(resolved)) return resolved
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const withExt = resolved + ext
    if (existsSync(withExt)) return withExt
  }
  return null
}

/**
 * Extract search entries from course source code.
 * Parses Page components to extract id, title (from first h1/h2), and text content.
 * When a Page contains a component reference (e.g. <IntroPage />), the content
 * is resolved from the imported component file.
 */
export function extractSearchEntries(source: string, filePath?: string): SearchEntry[] {
  const entries: SearchEntry[] = []
  const importMap = filePath ? parseImports(source, filePath) : new Map<string, string>()

  const pageRegex = /<Page\s+[^>]*?id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Page>/g
  let match: RegExpExecArray | null

  while ((match = pageRegex.exec(source)) !== null) {
    const pageId = match[1]
    const innerContent = match[2].trim()

    // Check if the content is a component reference like <IntroPage />
    const componentRef = innerContent.match(/^\s*<([A-Z]\w*)[\s\S]*?\/?\s*>\s*$/)

    let title: string
    let content: string

    if (componentRef && importMap.has(componentRef[1])) {
      const componentFile = importMap.get(componentRef[1])!
      const { readFileSync } = require('node:fs') as typeof import('fs')
      const componentSource = readFileSync(componentFile, 'utf-8')
      const extracted = extractContent(componentSource)
      title = extracted.title || pageId
      content = extracted.content
    } else {
      const extracted = extractContent(innerContent)
      title = extracted.title || pageId
      content = extracted.content
    }

    if (content) {
      entries.push({ pageId, title, content })
    }
  }

  return entries
}

/**
 * Vite plugin that generates a search index from Page components at build time.
 *
 * The plugin scans the entry module for <Page> components, extracts their text
 * content, and provides the index as a virtual module importable as JSON.
 * When pages are in separate files, it follows imports to read their content.
 *
 * Usage:
 *   import searchIndex from 'virtual:search-index'
 */
export function searchIndexPlugin(options: SearchIndexPluginOptions = {}): VitePlugin {
  const moduleId = options.moduleId ?? 'virtual:search-index'
  const resolvedId = '\0' + moduleId

  const entries: SearchEntry[] = []

  return {
    name: 'kurikulum-search-index',
    enforce: 'pre',

    resolveId(id) {
      if (id === moduleId) {
        return resolvedId
      }
    },

    load(id) {
      if (id === resolvedId) {
        return `export default ${JSON.stringify(entries)}`
      }
    },

    transform(code, id) {
      if (!/\.[jt]sx$/.test(id)) return
      if (!code.includes('<Page')) return

      const extracted = extractSearchEntries(code, id)
      if (extracted.length > 0) {
        const existingIds = new Set(entries.map((e) => e.pageId))
        for (const entry of extracted) {
          if (!existingIds.has(entry.pageId)) {
            entries.push(entry)
            existingIds.add(entry.pageId)
          }
        }
      }
    },
  }
}

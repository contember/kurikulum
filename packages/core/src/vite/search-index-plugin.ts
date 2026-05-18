import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { type ContentDirInfo, discoverContent } from './content-utils.ts'

export interface SearchIndexPluginOptions {
  /** Content directory relative to Vite root. Default 'src/content'. */
  contentDir?: string
  /** Virtual module ID. Default 'virtual:search-index'. */
  moduleId?: string
}

export interface SearchEntry {
  pageId: string
  title: string
  content: string
  keywords?: string[]
}

export type SearchIndex = Record<string, SearchEntry[]>

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Pull the body of the page component's `return ...` so the search index sees
// only the JSX, not the surrounding function declaration / type annotations /
// imports. Without this, stripTags on the whole source leaks TS syntax (e.g.
// `function HishingHowPage(): VNode { return (`) into search results.
function extractReturnBody(source: string): string | null {
  const match = source.match(/\breturn\s*([<(])/)
  if (!match) return null
  const openerIdx = match.index! + match[0].length - 1
  if (match[1] === '(') {
    return extractBalancedParens(source, openerIdx + 1)
  }
  // `return <jsx>` (no wrapping parens) — keep everything after `return`, then
  // let stripTags / stripBraceExpressions strip the JSX and any trailing `}`
  // from the enclosing function.
  return source.slice(openerIdx)
}

function extractBalancedParens(source: string, start: number): string | null {
  let i = start
  let depth = 1
  let inString: string | null = null
  let inLine = false
  let inBlock = false
  while (i < source.length && depth > 0) {
    const ch = source[i]
    const next = source[i + 1]
    if (inLine) {
      if (ch === '\n') inLine = false
    } else if (inBlock) {
      if (ch === '*' && next === '/') {
        inBlock = false
        i++
      }
    } else if (inString) {
      if (ch === '\\') i++
      else if (ch === inString) inString = null
    } else if (ch === '/' && next === '/') {
      inLine = true
      i++
    } else if (ch === '/' && next === '*') {
      inBlock = true
      i++
    } else if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
    } else if (ch === '(') depth++
    else if (ch === ')') depth--
    i++
  }
  if (depth !== 0) return null
  return source.slice(start, i - 1)
}

// Drop JSX expression containers like `{t('key')}` / `{variable}` / `{cond && <X />}`
// — they're noise (or other-language tokens) for a full-text search index, and we
// have no AST here to evaluate them. Tracks strings so a `}` inside a string
// literal doesn't close the wrong block.
function stripBraceExpressions(input: string): string {
  let out = ''
  let depth = 0
  let inString: string | null = null
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (inString) {
      if (depth === 0) out += ch
      if (ch === '\\') {
        i++
        if (depth === 0 && i < input.length) out += input[i]
      } else if (ch === inString) {
        inString = null
      }
      i++
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      if (depth === 0) out += ch
      i++
      continue
    }
    if (ch === '{') {
      depth++
      i++
      continue
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1)
      i++
      continue
    }
    if (depth === 0) out += ch
    i++
  }
  return out
}

function extractContent(source: string): { title: string; content: string } {
  const titleMatch = source.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/)
  const title = titleMatch ? stripTags(titleMatch[1]) : ''
  const body = extractReturnBody(source) ?? source
  const content = stripTags(stripBraceExpressions(body))
  return { title, content }
}

function parseImports(code: string, filePath: string): Map<string, string> {
  const dir = dirname(filePath)
  const map = new Map<string, string>()

  const namedRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = namedRegex.exec(code)) !== null) {
    const names = match[1].split(',').map((n) => n.split(' as ').pop()!.trim())
    for (const name of names) {
      const resolved = resolveImportPath(dir, match[2])
      if (resolved) map.set(name, resolved)
    }
  }

  const defaultRegex = /import\s+([A-Z]\w*)\s+from\s+['"]([^'"]+)['"]/g
  while ((match = defaultRegex.exec(code)) !== null) {
    const resolved = resolveImportPath(dir, match[2])
    if (resolved) map.set(match[1], resolved)
  }

  return map
}

function resolveImportPath(dir: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const resolved = resolve(dir, specifier)
  if (existsSync(resolved)) return resolved
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const withExt = resolved + ext
    if (existsSync(withExt)) return withExt
  }
  return null
}

/**
 * Parses an `export const pages = { ... }` block, returning an array of
 * (pageId, componentName) pairs in source order.
 */
function parsePagesMap(source: string): Array<[string, string]> {
  const blockMatch = source.match(/export\s+const\s+pages\s*=\s*\{([\s\S]*?)\}/)
  if (!blockMatch) return []

  const entryRegex = /\n?\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:\s*([A-Z][\w$]*)/g
  const entries: Array<[string, string]> = []
  let m: RegExpExecArray | null
  while ((m = entryRegex.exec(blockMatch[1])) !== null) {
    const id = m[1] ?? m[2] ?? m[3]
    const componentName = m[4]
    if (id && componentName) entries.push([id, componentName])
  }
  return entries
}

/**
 * Extracts search entries for a single locale by reading content/<locale>/index.ts,
 * walking its `pages` export map, and following named imports to each page body.
 */
export function extractLocaleEntries(indexPath: string): SearchEntry[] {
  if (!existsSync(indexPath)) return []
  const source = readFileSync(indexPath, 'utf-8')
  const importMap = parseImports(source, indexPath)
  const entries: SearchEntry[] = []

  for (const [pageId, componentName] of parsePagesMap(source)) {
    const componentFile = importMap.get(componentName)
    if (!componentFile) continue
    const body = readFileSync(componentFile, 'utf-8')
    const { title, content } = extractContent(body)
    if (content) {
      entries.push({ pageId, title: title || pageId, content })
    }
  }

  return entries
}

/**
 * Vite plugin that builds per-locale search indexes from content/<locale>/index.ts.
 * Exposed as a virtual module returning SearchIndex (Record<locale, SearchEntry[]>).
 */
export function searchIndexPlugin(options: SearchIndexPluginOptions = {}): Plugin {
  const moduleId = options.moduleId ?? 'virtual:search-index'
  const resolvedId = '\0' + moduleId
  const contentDirInput = options.contentDir ?? 'src/content'

  let info: ContentDirInfo
  let index: SearchIndex = {}

  function rebuild() {
    index = {}
    for (const locale of info.locales) {
      const indexPath = resolve(info.absolute, locale, 'index.ts')
      index[locale] = extractLocaleEntries(indexPath)
    }
  }

  return {
    name: 'kurikulum-search-index',
    enforce: 'pre',

    configResolved(config) {
      info = discoverContent(config.root, contentDirInput)
      rebuild()
    },

    handleHotUpdate(ctx) {
      if (!info || !ctx.file.startsWith(info.absolute)) return
      rebuild()
      const mod = ctx.server.moduleGraph.getModuleById(resolvedId)
      if (mod) ctx.server.moduleGraph.invalidateModule(mod)
    },

    resolveId(id) {
      if (id === moduleId) return resolvedId
    },

    load(id) {
      if (id !== resolvedId) return
      return `export default ${JSON.stringify(index)}`
    },
  }
}

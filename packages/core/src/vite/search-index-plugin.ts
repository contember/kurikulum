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

/**
 * Strip JSX/HTML tags from text content to produce plain text.
 */
function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Extract search entries from course source code.
 * Parses Page components to extract id, title (from first h1/h2), and text content.
 */
export function extractSearchEntries(source: string): Array<{
  pageId: string
  title: string
  content: string
  keywords?: string[]
}> {
  const entries: Array<{
    pageId: string
    title: string
    content: string
    keywords?: string[]
  }> = []

  // Match Page components with their content - support both JSX patterns
  // <Page id="xxx" ...>content</Page>
  const pageRegex = /<Page\s+[^>]*?id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Page>/g
  let match: RegExpExecArray | null

  while ((match = pageRegex.exec(source)) !== null) {
    const pageId = match[1]
    const content = match[2]

    // Extract title from first h1 or h2
    const titleMatch = content.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/)
    const title = titleMatch ? stripTags(titleMatch[1]) : pageId

    // Strip all tags to get plain text content
    const plainContent = stripTags(content)

    if (plainContent) {
      entries.push({
        pageId,
        title,
        content: plainContent,
      })
    }
  }

  return entries
}

/**
 * Vite plugin that generates a search index from Page components at build time.
 *
 * The plugin scans the entry module for <Page> components, extracts their text
 * content, and provides the index as a virtual module importable as JSON.
 *
 * Usage:
 *   import searchIndex from 'virtual:search-index'
 */
export function searchIndexPlugin(options: SearchIndexPluginOptions = {}): VitePlugin {
  const moduleId = options.moduleId ?? 'virtual:search-index'
  const resolvedId = '\0' + moduleId

  let entries: Array<{
    pageId: string
    title: string
    content: string
    keywords?: string[]
  }> = []

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
      // Only scan tsx/jsx files that contain <Page components
      if (!/\.[jt]sx$/.test(id)) return
      if (!code.includes('<Page')) return

      const extracted = extractSearchEntries(code)
      if (extracted.length > 0) {
        // Merge entries, avoiding duplicates by pageId
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

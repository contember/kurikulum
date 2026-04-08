import type { SearchEntry, SearchResult } from './context.ts'

/**
 * Normalize text for diacritics-insensitive comparison.
 * Removes combining diacritical marks after NFD decomposition.
 */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Extract a snippet around the first match of query in text.
 * Returns ~60 chars of context around the match.
 */
export function extractSnippet(text: string, query: string): string {
  const normalizedText = normalize(text)
  const normalizedQuery = normalize(query)
  const index = normalizedText.indexOf(normalizedQuery)

  if (index === -1) return text.slice(0, 120) + (text.length > 120 ? '...' : '')

  const snippetRadius = 60
  const start = Math.max(0, index - snippetRadius)
  const end = Math.min(text.length, index + query.length + snippetRadius)
  let snippet = ''
  if (start > 0) snippet += '...'
  snippet += text.slice(start, end)
  if (end < text.length) snippet += '...'
  return snippet
}

/**
 * Search entries for a query string.
 * Case-insensitive, diacritics-insensitive substring match.
 */
export function searchEntries(entries: SearchEntry[], query: string): SearchResult[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const normalizedQuery = normalize(trimmed)

  const results: SearchResult[] = []

  for (const entry of entries) {
    const normalizedTitle = normalize(entry.title)
    const normalizedContent = normalize(entry.content)
    const normalizedKeywords = (entry.keywords ?? []).map(normalize)

    const titleMatch = normalizedTitle.includes(normalizedQuery)
    const contentMatch = normalizedContent.includes(normalizedQuery)
    const keywordMatch = normalizedKeywords.some((k) => k.includes(normalizedQuery))

    if (titleMatch || contentMatch || keywordMatch) {
      const snippet = contentMatch
        ? extractSnippet(entry.content, trimmed)
        : titleMatch
        ? entry.content.slice(0, 120) + (entry.content.length > 120 ? '...' : '')
        : extractSnippet(entry.content, trimmed)

      results.push({
        pageId: entry.pageId,
        title: entry.title,
        snippet,
      })
    }
  }

  return results
}

import { Search as S, useFocusTrap, useSearch } from 'kurikulum'
import type { SearchEntry } from 'kurikulum'
import type { VNode } from 'preact'
import { useEffect, useRef } from 'preact/hooks'

export interface SearchProps {
  index: SearchEntry[]
  children?: preact.ComponentChildren
}

export function Search({ index, children }: SearchProps): VNode {
  return (
    <S.Root index={index}>
      {children}
    </S.Root>
  )
}

export function SearchButton(): VNode {
  const ctx = useSearch()

  return (
    <button
      type="button"
      onClick={ctx.open}
      class="px-3 py-2 text-sm bg-bg-surface text-text border border-border rounded-default hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label="Search course content (Ctrl+K)"
    >
      <span class="flex items-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span class="hidden sm:inline">Search</span>
      </span>
    </button>
  )
}

export function SearchModal(): VNode | null {
  const ctx = useSearch()
  const modalRef = useRef<HTMLDivElement>(null)

  useFocusTrap(modalRef, ctx.isOpen)

  if (!ctx.isOpen) return null

  return (
    <div
      ref={modalRef}
      class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      role="presentation"
      onKeyDown={(e) => {
        if (e.key === 'Escape') ctx.close()
      }}
    >
      {/* Backdrop */}
      <div class="fixed inset-0 bg-black/50" aria-hidden="true" onClick={ctx.close} />

      {/* Modal */}
      <div
        class="relative z-10 w-full max-w-lg bg-bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
        role="dialog"
        aria-label="Search"
        aria-modal="true"
      >
        <div class="p-4 border-b border-border">
          <S.Input
            class="w-full px-3 py-2 border border-border rounded-default bg-bg-surface text-text placeholder-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Search course content..."
          />
        </div>

        <SearchResultsList />

        <div class="px-4 py-2 border-t border-border text-xs text-text-secondary flex justify-between">
          <span>Navigate with arrow keys</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )
}

function SearchResultsList(): VNode | null {
  const ctx = useSearch()

  if (!ctx.query.trim()) return null

  return (
    <div class="max-h-80 overflow-y-auto">
      <div aria-live="polite" role="status" class="sr-only">
        {ctx.results.length > 0
          ? `${ctx.results.length} results found`
          : `No results found for "${ctx.query}"`}
      </div>
      {ctx.results.length > 0
        ? (
          <ul role="listbox" id="search-results-listbox" class="py-2">
            {ctx.results.map((result, i) => (
              <li key={result.pageId}>
                <SearchResultItem result={result} index={i} />
              </li>
            ))}
          </ul>
        )
        : (
          <div class="px-4 py-8 text-center text-text-secondary" role="status">
            No results found for "{ctx.query}"
          </div>
        )}
    </div>
  )
}

function SearchResultItem({ result, index }: { result: { pageId: string; title: string; snippet: string }; index: number }): VNode {
  const ctx = useSearch()
  const isActive = index === ctx.activeIndex
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isActive])

  return (
    <button
      ref={ref}
      type="button"
      id={`search-result-${index}`}
      class={`w-full text-left px-4 py-3 hover:bg-bg-muted focus:outline-none cursor-pointer ${isActive ? 'bg-bg-muted' : ''}`}
      role="option"
      aria-selected={isActive}
      onClick={() => ctx.navigateTo(result.pageId)}
      onMouseEnter={() => ctx.setActiveIndex(index)}
    >
      <div class="font-medium text-text">{result.title}</div>
      <div class="text-sm text-text-secondary mt-1 line-clamp-2">
        <Highlight text={result.snippet} query={ctx.query} />
      </div>
    </button>
  )
}

function Highlight({ text, query }: { text: string; query: string }): VNode {
  if (!query.trim()) return <>{text}</>

  // Normalize for matching but render original text
  const normalizedText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const index = normalizedText.indexOf(normalizedQuery)
  if (index === -1) return <>{text}</>

  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)

  return (
    <>
      {before}
      <mark class="bg-warning/30 text-text rounded-sm px-0.5">{match}</mark>
      {after}
    </>
  )
}

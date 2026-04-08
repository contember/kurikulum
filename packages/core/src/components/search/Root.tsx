import type { ComponentChildren, VNode } from 'preact'
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks'
import { CourseContext } from '../../context.tsx'
import { SearchContext } from './context.ts'
import type { SearchEntry } from './context.ts'
import { searchEntries } from './search-engine.ts'

export interface SearchRootProps {
  index: SearchEntry[]
  children?: ComponentChildren
}

export function Root({ index, children }: SearchRootProps): VNode {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const courseCtx = useContext(CourseContext)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setActiveIndex(-1)
  }, [])

  const allResults = useMemo(() => searchEntries(index, query), [index, query])

  // Filter results to only include pages the user has already reached
  const results = useMemo(() => {
    if (!courseCtx) return allResults
    const { state } = courseCtx.runtime
    const currentIdx = state.pages.indexOf(state.currentPage)
    const completedIndices = state.pages
      .map((p, i) => state.completions[p] ? i : -1)
      .filter(i => i >= 0)
    const maxReached = Math.max(currentIdx, ...completedIndices, 0)
    return allResults.filter(r => {
      const idx = state.pages.indexOf(r.pageId)
      return idx >= 0 && idx <= maxReached
    })
  }, [allResults, courseCtx])

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1)
  }, [results])

  const navigateTo = useCallback(
    (pageId: string) => {
      if (courseCtx) {
        courseCtx.runtime.navigateTo(pageId)
      }
      setIsOpen(false)
      setQuery('')
    },
    [courseCtx],
  )

  // Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const ctxValue = useMemo(
    () => ({ query, setQuery, results, isOpen, open, close, navigateTo, activeIndex, setActiveIndex }),
    [query, results, isOpen, open, close, navigateTo, activeIndex],
  )

  return (
    <SearchContext.Provider value={ctxValue}>
      {children}
    </SearchContext.Provider>
  )
}

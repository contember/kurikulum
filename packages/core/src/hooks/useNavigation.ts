import { useContext, useEffect, useReducer } from 'preact/hooks'
import { CourseContext } from '../context.tsx'

export function useNavigation() {
  const ctx = useContext(CourseContext)
  if (!ctx) {
    throw new Error('useNavigation must be used within a CourseProvider')
  }

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)
  useEffect(() => ctx.subscribe(forceUpdate), [ctx])

  const { runtime } = ctx
  const { state } = runtime
  const visiblePages = ctx.getVisiblePages()
  const pageIndex = visiblePages.indexOf(state.currentPage)

  const hasNext = pageIndex < visiblePages.length - 1
  const currentComplete = runtime.isPageComplete(state.currentPage)

  return {
    currentPage: state.currentPage,
    next: () => runtime.nextPage(),
    prev: () => runtime.prevPage(),
    goTo: (id: string) => runtime.navigateTo(id),
    canGoNext: hasNext && currentComplete,
    canGoPrev: pageIndex > 0,
    pageIndex,
    totalPages: visiblePages.length,
  }
}

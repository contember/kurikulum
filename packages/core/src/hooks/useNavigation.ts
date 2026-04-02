import { useContext, useEffect, useReducer } from 'preact/hooks'
import { CourseContext } from '../context.ts'

export function useNavigation() {
  const ctx = useContext(CourseContext)
  if (!ctx) {
    throw new Error('useNavigation must be used within a CourseProvider')
  }

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)
  useEffect(() => ctx.subscribe(forceUpdate), [ctx])

  const { runtime } = ctx
  const { state } = runtime
  const pageIndex = state.pages.indexOf(state.currentPage)

  return {
    currentPage: state.currentPage,
    next: () => runtime.nextPage(),
    prev: () => runtime.prevPage(),
    goTo: (id: string) => runtime.navigateTo(id),
    canGoNext: pageIndex < state.pages.length - 1,
    canGoPrev: pageIndex > 0,
    pageIndex,
    totalPages: state.pages.length,
  }
}

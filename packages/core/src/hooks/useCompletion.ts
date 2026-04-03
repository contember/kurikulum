import { useContext, useEffect, useReducer } from 'preact/hooks'
import { CourseContext } from '../context.tsx'
import { PageContext } from '../components/page/context.ts'

export function useCompletion(id: string) {
  const ctx = useContext(CourseContext)
  if (!ctx) {
    throw new Error('useCompletion must be used within a CourseProvider')
  }

  const pageCtx = useContext(PageContext)

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)
  useEffect(() => ctx.subscribe(() => forceUpdate(0)), [ctx])

  // Register interactive children with the page's CompletableRegistry
  useEffect(() => {
    if (!pageCtx || pageCtx.completion !== 'interactive' || id === pageCtx.id) return
    pageCtx.registry.register(pageCtx.id, id)
    return () => { pageCtx.registry.unregister(pageCtx.id, id) }
  }, [pageCtx, id])

  const { runtime } = ctx

  return {
    isComplete: runtime.isComplete(id),
    markComplete: () => runtime.markComplete(id),
  }
}

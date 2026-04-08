import { useContext, useEffect, useReducer } from 'preact/hooks'
import { resolveCompletionStrategy } from '../completion.ts'
import { CourseContext } from '../context.tsx'

export function usePage() {
  const ctx = useContext(CourseContext)
  if (!ctx) {
    throw new Error('usePage must be used within a CourseProvider')
  }

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)
  useEffect(() => ctx.subscribe(() => forceUpdate(0)), [ctx])

  const pageId = ctx.runtime.state.currentPage
  const completion = resolveCompletionStrategy(
    ctx.pageCompletions?.[pageId],
    ctx.defaultCompletion,
  )

  return {
    pageId,
    completion,
  }
}

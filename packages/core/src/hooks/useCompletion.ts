import { useContext, useEffect, useReducer } from 'preact/hooks'
import { CourseContext } from '../context.ts'

export function useCompletion(id: string) {
  const ctx = useContext(CourseContext)
  if (!ctx) {
    throw new Error('useCompletion must be used within a CourseProvider')
  }

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)
  useEffect(() => ctx.subscribe(forceUpdate), [ctx])

  const { runtime } = ctx

  return {
    isComplete: runtime.isComplete(id),
    markComplete: () => runtime.markComplete(id),
  }
}

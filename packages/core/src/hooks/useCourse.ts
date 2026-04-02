import { useContext, useEffect, useReducer } from 'preact/hooks'
import { CourseContext } from '../context.ts'
import type { CourseRuntime } from '../types.ts'

export function useCourse(): CourseRuntime {
  const ctx = useContext(CourseContext)
  if (!ctx) {
    throw new Error('useCourse must be used within a CourseProvider')
  }

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)
  useEffect(() => ctx.subscribe(forceUpdate), [ctx])

  return ctx.runtime
}

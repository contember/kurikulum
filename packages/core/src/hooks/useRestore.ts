import { useContext, useEffect, useReducer } from 'preact/hooks'
import { CourseContext } from '../context.tsx'

export interface RestoreContext {
  hasStoredState: boolean
  storedPage: string | null
  resume: () => void
  restart: () => void
}

export function useRestore(): RestoreContext {
  const ctx = useContext(CourseContext)
  if (!ctx) {
    throw new Error('useRestore must be used within a CourseProvider')
  }

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)
  useEffect(() => ctx.subscribe(() => forceUpdate(0)), [ctx])

  const { restoreInfo, restoreDismissed } = ctx
  const hasStoredState = restoreInfo.restored && !restoreDismissed

  return {
    hasStoredState,
    storedPage: hasStoredState ? restoreInfo.storedPage : null,
    resume() {
      ctx.dismissRestore()
    },
    restart() {
      ctx.runtime.reset()
      ctx.dismissRestore()
    },
  }
}

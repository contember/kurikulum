import { createContext } from 'preact'
import type { ComponentChildren, VNode } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import type { CourseRuntime, CourseConfig, CompletionStrategy, DeliveryAdapter, RestoreInfo } from './types.ts'
import { createCourseRuntime } from './runtime.ts'

export interface CourseContextValue {
  runtime: CourseRuntime
  adapter: DeliveryAdapter
  subscribe(listener: () => void): () => void
  defaultCompletion: CompletionStrategy
  pageCompletions?: Record<string, CompletionStrategy>
  pageConditions: Record<string, () => boolean>
  getVisiblePages(): string[]
  restoreInfo: RestoreInfo
  restoreDismissed: boolean
  dismissRestore(): void
}

export const CourseContext = createContext<CourseContextValue | null>(null)

/**
 * Simple pub/sub notifier for state change subscriptions.
 * Used by CourseProvider to notify hooks when runtime state changes.
 */
export function createNotifier() {
  const listeners = new Set<() => void>()
  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    notify(): void {
      for (const listener of listeners) {
        listener()
      }
    },
  }
}

function createNoopAdapter(): DeliveryAdapter {
  return {
    async initialize() {},
    getSuspendData() { return null },
    setSuspendData() {},
    setScore() {},
    setStatus() {},
    setLocation() {},
    getLocation() { return null },
    setSessionTime() {},
    recordInteraction() {},
    commit() {},
    terminate() {},
  }
}

export interface CourseProviderProps {
  config: CourseConfig
  adapter?: DeliveryAdapter
  children?: ComponentChildren
}

export function CourseProvider({ config, adapter, children }: CourseProviderProps): VNode {
  const ref = useRef<CourseContextValue | null>(null)

  if (!ref.current) {
    const resolvedAdapter = adapter ?? createNoopAdapter()
    const runtime = createCourseRuntime(config, resolvedAdapter)
    const { subscribe, notify } = createNotifier()

    const pageConditions: Record<string, () => boolean> = {}

    function getVisiblePages(): string[] {
      return runtime.state.pages.filter(id => {
        const cond = pageConditions[id]
        return cond ? cond() : true
      })
    }

    const originalNavigateTo = runtime.navigateTo.bind(runtime)
    const originalMarkComplete = runtime.markComplete.bind(runtime)
    const originalSubmitScore = runtime.submitScore.bind(runtime)
    const originalSubmitAssessmentScore = runtime.submitAssessmentScore.bind(runtime)

    runtime.navigateTo = (pageId: string) => { originalNavigateTo(pageId); notify() }
    runtime.markComplete = (id: string) => { originalMarkComplete(id); notify() }
    runtime.submitScore = (score: number, max: number, threshold?: number) => {
      originalSubmitScore(score, max, threshold); notify()
    }
    runtime.submitAssessmentScore = (assessmentId: string, score: number, max: number, threshold?: number, weight?: number) => {
      originalSubmitAssessmentScore(assessmentId, score, max, threshold, weight); notify()
    }

    runtime.nextPage = () => {
      const visible = getVisiblePages()
      const idx = visible.indexOf(runtime.state.currentPage)
      if (idx < visible.length - 1) {
        runtime.navigateTo(visible[idx + 1])
      }
    }

    runtime.prevPage = () => {
      const visible = getVisiblePages()
      const idx = visible.indexOf(runtime.state.currentPage)
      if (idx > 0) {
        runtime.navigateTo(visible[idx - 1])
      }
    }

    ref.current = {
      runtime,
      adapter: resolvedAdapter,
      subscribe,
      defaultCompletion: config.defaultCompletion ?? 'mount',
      pageConditions,
      getVisiblePages,
      restoreInfo: { restored: false, storedPage: null },
      restoreDismissed: false,
      dismissRestore() {
        ref.current!.restoreDismissed = true
        notify()
      },
    }
  }

  const ctx = ref.current
  const initialized = useRef(false)

  if (!initialized.current) {
    initialized.current = true
    const info = ctx.runtime.restore()
    ctx.restoreInfo = info
  }

  useEffect(() => {
    const handleBeforeUnload = () => { ctx.runtime.suspend() }
    globalThis.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      globalThis.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [ctx])

  return (
    <CourseContext.Provider value={ctx}>
      {children}
    </CourseContext.Provider>
  )
}

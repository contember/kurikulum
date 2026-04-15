import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect, useMemo, useRef } from 'preact/hooks'
import { CompletableRegistry, createCompletionHandler } from '../../completion.ts'
import type { CompletionHandler, CompletionStrategy } from '../../completion.ts'
import { CourseContext } from '../../context.tsx'
import { useCompletion, useCourse } from '../../hooks/index.ts'
import type { CourseRuntime } from '../../types.ts'
import { PageContext } from './context.ts'

export interface PageRootProps {
  id: string
  completion?: CompletionStrategy
  completionTimer?: number
  active?: boolean
  when?: (runtime: CourseRuntime) => boolean
  children?: ComponentChildren
  class?: string
}

export function Root({ id, completion = 'mount', completionTimer, active = true, children, class: className }: PageRootProps): VNode {
  const { markComplete, isComplete } = useCompletion(id)
  const runtime = useCourse()
  const ctx = useContext(CourseContext)!
  const sentinelRef = useRef<HTMLDivElement>(null)
  const handlerRef = useRef<CompletionHandler | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const registry = useMemo(() => new CompletableRegistry(), [id])

  useEffect(() => {
    if (!active || isComplete) return

    const handler = createCompletionHandler(completion, markComplete, {
      timerSeconds: completionTimer,
      sentinel: sentinelRef.current ?? undefined,
      pageId: id,
      registry,
      getCompletions: () => runtime.state.completions,
    })

    handlerRef.current = handler
    handler.start()

    // For interactive strategy, re-check on every state change
    let unsub: (() => void) | undefined
    if (completion === 'interactive') {
      unsub = ctx.subscribe(() => {
        if (runtime.isComplete(id)) return
        if (registry.isPageInteractiveComplete(id, runtime.state.completions)) {
          markComplete()
        }
      })
    }

    return () => {
      handler.stop()
      handlerRef.current = null
      unsub?.()
    }
  }, [id, completion, isComplete, active])

  useEffect(() => {
    if (active) {
      mainRef.current?.focus()
    }
  }, [id, active])

  return (
    <PageContext.Provider value={{ sentinelRef, id, completion, registry }}>
      <main
        ref={mainRef}
        tabIndex={-1}
        id="page-content"
        class={className}
        data-page-id={id}
        data-complete={isComplete || undefined}
      >
        {children}
      </main>
    </PageContext.Provider>
  )
}

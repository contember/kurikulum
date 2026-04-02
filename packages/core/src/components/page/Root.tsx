import type { ComponentChildren, VNode } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import {
  useCompletion,
  useCourse,
} from '../../hooks/index.ts'
import {
  createCompletionHandler,
  CompletableRegistry,
} from '../../completion.ts'
import type { CompletionStrategy, CompletionHandler } from '../../completion.ts'
import { PageContext } from './context.ts'

export interface PageRootProps {
  id: string
  completion?: CompletionStrategy
  completionTimer?: number
  children: ComponentChildren
  class?: string
}

export function Root({ id, completion = 'mount', completionTimer, children, class: className }: PageRootProps): VNode {
  const { markComplete, isComplete } = useCompletion(id)
  const runtime = useCourse()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const handlerRef = useRef<CompletionHandler | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isComplete) return

    const handler = createCompletionHandler(completion, markComplete, {
      timerSeconds: completionTimer,
      sentinel: sentinelRef.current ?? undefined,
      pageId: id,
      registry: new CompletableRegistry(),
      getCompletions: () => runtime.state.completions,
    })

    handlerRef.current = handler
    handler.start()

    return () => {
      handler.stop()
      handlerRef.current = null
    }
  }, [id, completion, isComplete])

  useEffect(() => {
    mainRef.current?.focus()
  }, [id])

  return (
    <PageContext.Provider value={{ sentinelRef, id, completion }}>
      <div
        ref={mainRef}
        tabIndex={-1}
        role="main"
        id="page-content"
        class={className}
        data-page-id={id}
        data-complete={isComplete || undefined}
      >
        {children}
      </div>
    </PageContext.Provider>
  )
}

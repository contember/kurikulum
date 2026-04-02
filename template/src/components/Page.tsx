import type { ComponentChildren, VNode } from 'preact'
import { h } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import {
  useCompletion,
  useCourse,
  createCompletionHandler,
  CompletableRegistry,
  type CompletionStrategy,
  type CompletionHandler,
} from '@kurikulum/core'

export interface PageProps {
  id: string
  completion?: CompletionStrategy
  completionTimer?: number
  children: ComponentChildren
}

export function Page({ id, completion = 'mount', completionTimer, children }: PageProps): VNode {
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

  // Focus management: focus main content on page mount
  useEffect(() => {
    mainRef.current?.focus()
  }, [id])

  return h('div', { ref: mainRef, tabIndex: -1, role: 'main', id: 'page-content', class: 'outline-none' },
    children,
    completion === 'scroll' ? h('div', { ref: sentinelRef, 'aria-hidden': 'true' }) : null,
  )
}

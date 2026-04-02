import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect, useRef } from 'preact/hooks'
import { MatchingContext } from './context.ts'

export interface MatchingFeedbackProps {
  correct?: ComponentChildren
  incorrect?: ComponentChildren
  class?: string
}

export function Feedback({ correct, incorrect, class: className }: MatchingFeedbackProps): VNode | null {
  const ctx = useContext(MatchingContext)
  if (!ctx) throw new Error('Matching.Feedback must be used within Matching.Root')

  const feedbackRef = useRef<HTMLDivElement>(null)

  const isVisible = ctx.submitted
  const message = isVisible ? (ctx.correct ? correct : incorrect) : null

  useEffect(() => {
    if (isVisible && message) {
      feedbackRef.current?.focus()
    }
  }, [isVisible])

  if (!isVisible || !message) return null

  return (
    <div
      ref={feedbackRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      class={className}
      data-correct={String(ctx.correct)}
    >
      {message}
    </div>
  )
}

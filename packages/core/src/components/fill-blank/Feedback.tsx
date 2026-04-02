import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect, useRef } from 'preact/hooks'
import { FillBlankContext } from './context.ts'

export interface FillBlankFeedbackProps {
  correct?: ComponentChildren
  incorrect?: ComponentChildren
  class?: string
}

export function Feedback({ correct, incorrect, class: className }: FillBlankFeedbackProps): VNode | null {
  const ctx = useContext(FillBlankContext)
  if (!ctx) throw new Error('FillBlank.Feedback must be used within FillBlank.Root')

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

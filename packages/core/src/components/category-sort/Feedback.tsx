import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect, useRef } from 'preact/hooks'
import { CategorySortContext } from './context.ts'

export interface CategorySortFeedbackProps {
  correct?: ComponentChildren
  incorrect?: ComponentChildren
  class?: string
}

export function Feedback({ correct, incorrect, class: className }: CategorySortFeedbackProps): VNode | null {
  const ctx = useContext(CategorySortContext)
  if (!ctx) throw new Error('CategorySort.Feedback must be used within CategorySort.Root')

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

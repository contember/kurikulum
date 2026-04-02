import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect, useRef } from 'preact/hooks'
import { AssessmentContext } from './context.ts'

export interface StatusProps {
  class?: string
  children?: (state: { score: number | null; maxScore: number; passed: boolean | null }) => ComponentChildren
}

export function Status({ children, class: className }: StatusProps): VNode | null {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('Assessment.Status must be used within Assessment.Root')

  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ctx.submitted) {
      statusRef.current?.focus()
    }
  }, [ctx.submitted])

  if (!ctx.submitted) return null

  const content = typeof children === 'function'
    ? children({ score: ctx.score, maxScore: ctx.maxScore, passed: ctx.passed })
    : <p>Skóre: {ctx.score}/{ctx.maxScore}</p>

  return (
    <div
      ref={statusRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      class={className}
      data-passed={String(ctx.passed)}
    >
      {content}
    </div>
  )
}

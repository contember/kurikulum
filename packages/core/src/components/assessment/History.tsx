import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import type { AttemptRecord } from '../../types.ts'
import { AssessmentContext } from './context.ts'

export interface HistoryProps {
  class?: string
  children?: (history: AttemptRecord[]) => ComponentChildren
}

export function History({ children, class: className }: HistoryProps): VNode | null {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('Assessment.History must be used within Assessment.Root')

  if (ctx.history.length === 0) return null

  const content = typeof children === 'function'
    ? children(ctx.history)
    : (
      <ul>
        {ctx.history.map((attempt, i) => (
          <li key={i}>
            Pokus {i + 1}: {Math.round(attempt.score / attempt.maxScore * 100)} %
            {attempt.passed ? ' ✓' : ' ✗'}
          </li>
        ))}
      </ul>
    )

  return (
    <div class={className}>
      {content}
    </div>
  )
}

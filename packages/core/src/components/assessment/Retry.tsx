import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { AssessmentContext } from './context.ts'
import type { HeadlessPartProps } from '../types.ts'

export function Retry({ children, class: className }: HeadlessPartProps): VNode | null {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('Assessment.Retry must be used within Assessment.Root')

  if (!ctx.canRetry) return null

  return (
    <button
      type="button"
      onClick={ctx.retry}
      class={className}
    >
      {children}
    </button>
  )
}

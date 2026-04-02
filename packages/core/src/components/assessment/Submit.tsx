import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { AssessmentContext } from './context.ts'
import type { HeadlessPartProps } from '../types.ts'

export function Submit({ children, class: className }: HeadlessPartProps): VNode | null {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('Assessment.Submit must be used within Assessment.Root')

  if (ctx.submitted) return null

  return (
    <button
      type="button"
      onClick={ctx.submit}
      class={className}
    >
      {children}
    </button>
  )
}

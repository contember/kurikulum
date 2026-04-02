import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { AssessmentContext } from './context.ts'
import type { HeadlessPartProps } from '../types.ts'

export function AttemptsExhausted({ children, class: className }: HeadlessPartProps): VNode | null {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('Assessment.AttemptsExhausted must be used within Assessment.Root')

  if (!ctx.attemptsExhausted) return null

  return <p class={className}>{children}</p>
}

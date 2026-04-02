import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { MCQContext } from './context.ts'
import type { HeadlessPartProps } from '../types.ts'

export function Submit({ children, class: className }: HeadlessPartProps): VNode | null {
  const ctx = useContext(MCQContext)
  if (!ctx) throw new Error('MCQ.Submit must be used within MCQ.Root')

  if (!ctx.isStandalone || ctx.submitted) return null

  const disabled = ctx.selected === null

  return (
    <button
      type="button"
      onClick={ctx.submit}
      disabled={disabled}
      aria-disabled={disabled}
      class={className}
      data-disabled={disabled || undefined}
    >
      {children}
    </button>
  )
}

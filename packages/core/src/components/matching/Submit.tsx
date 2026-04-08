import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import type { HeadlessPartProps } from '../types.ts'
import { MatchingContext } from './context.ts'

export function Submit({ children, class: className }: HeadlessPartProps): VNode | null {
  const ctx = useContext(MatchingContext)
  if (!ctx) throw new Error('Matching.Submit must be used within Matching.Root')

  if (!ctx.isStandalone || ctx.submitted) return null

  const allSelected = ctx.selections.size >= ctx.pairs.length && ctx.pairs.length > 0
  const disabled = !allSelected

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

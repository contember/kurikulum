import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { FillBlankContext } from './context.ts'
import type { HeadlessPartProps } from '../types.ts'

export function Submit({ children, class: className }: HeadlessPartProps): VNode | null {
  const ctx = useContext(FillBlankContext)
  if (!ctx) throw new Error('FillBlank.Submit must be used within FillBlank.Root')

  if (!ctx.isStandalone || ctx.submitted) return null

  const disabled = ctx.value.trim() === ''

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

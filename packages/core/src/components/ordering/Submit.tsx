import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { OrderingContext } from './context.ts'
import type { HeadlessPartProps } from '../types.ts'

export function Submit({ children, class: className }: HeadlessPartProps): VNode | null {
  const ctx = useContext(OrderingContext)
  if (!ctx) throw new Error('Ordering.Submit must be used within Ordering.Root')

  if (!ctx.isStandalone || ctx.submitted) return null

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

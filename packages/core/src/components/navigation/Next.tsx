import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import type { HeadlessPartProps } from '../types.ts'
import { NavigationContext } from './context.ts'

export function Next({ children, class: className }: HeadlessPartProps): VNode {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('Navigation.Next must be used within Navigation.Root')

  return (
    <button
      type="button"
      disabled={!ctx.canGoNext}
      aria-disabled={!ctx.canGoNext}
      onClick={ctx.next}
      class={className}
      data-disabled={!ctx.canGoNext || undefined}
    >
      {children}
    </button>
  )
}

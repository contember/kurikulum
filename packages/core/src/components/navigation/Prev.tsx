import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { NavigationContext } from './context.ts'
import type { HeadlessPartProps } from '../types.ts'

export function Prev({ children, class: className }: HeadlessPartProps): VNode {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('Navigation.Prev must be used within Navigation.Root')

  return (
    <button
      type="button"
      disabled={!ctx.canGoPrev}
      aria-disabled={!ctx.canGoPrev}
      onClick={ctx.prev}
      class={className}
      data-disabled={!ctx.canGoPrev || undefined}
    >
      {children}
    </button>
  )
}

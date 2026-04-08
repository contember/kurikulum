import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import type { HeadlessPartProps } from '../types.ts'
import { CategorySortContext } from './context.ts'

export function Submit({ children, class: className }: HeadlessPartProps): VNode | null {
  const ctx = useContext(CategorySortContext)
  if (!ctx) throw new Error('CategorySort.Submit must be used within CategorySort.Root')

  if (!ctx.isStandalone || ctx.submitted) return null

  return (
    <button
      type="button"
      onClick={ctx.submit}
      class={className}
      disabled={ctx.assignments.size < ctx.items.length}
    >
      {children}
    </button>
  )
}

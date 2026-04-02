import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { NavigationContext } from './context.ts'

export interface ProgressProps {
  class?: string
  children?: (state: { pageIndex: number; totalPages: number }) => ComponentChildren
}

export function Progress({ children, class: className }: ProgressProps): VNode {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('Navigation.Progress must be used within Navigation.Root')

  const content = typeof children === 'function'
    ? children({ pageIndex: ctx.pageIndex, totalPages: ctx.totalPages })
    : `${ctx.pageIndex + 1} / ${ctx.totalPages}`

  return (
    <span aria-current="page" class={className}>
      {content}
    </span>
  )
}

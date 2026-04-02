import type { VNode } from 'preact'
import type { HeadlessPartProps } from '../types.ts'

export function ItemLabel({ children, class: className }: HeadlessPartProps): VNode {
  return <span class={className}>{children}</span>
}

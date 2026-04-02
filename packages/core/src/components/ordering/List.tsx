import type { VNode } from 'preact'
import type { HeadlessPartProps } from '../types.ts'

export function List({ children, class: className }: HeadlessPartProps): VNode {
  return <div class={className} role="list" style="display:flex;flex-direction:column">{children}</div>
}

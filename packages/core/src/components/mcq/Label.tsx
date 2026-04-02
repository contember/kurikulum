import type { VNode } from 'preact'
import type { HeadlessPartProps } from '../types.ts'

export function Label({ children, class: className }: HeadlessPartProps): VNode {
  return <legend class={className}>{children}</legend>
}

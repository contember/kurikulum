import type { ComponentChildren, VNode } from 'preact'
import { h } from 'preact'

export interface TextProps {
  children: ComponentChildren
}

export function Text({ children }: TextProps): VNode {
  return h('div', {
    class: 'max-w-none prose prose-lg',
  }, children)
}

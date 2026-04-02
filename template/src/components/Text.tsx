import type { ComponentChildren, VNode } from 'preact'

export interface TextProps {
  children: ComponentChildren
}

export function Text({ children }: TextProps): VNode {
  return (
    <div class="max-w-none prose prose-lg">
      {children}
    </div>
  )
}

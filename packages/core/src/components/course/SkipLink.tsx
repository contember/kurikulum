import type { VNode } from 'preact'
import type { HeadlessPartProps } from '../types.ts'

export interface SkipLinkProps extends HeadlessPartProps {
  href?: string
}

export function SkipLink({ children, class: className, href = '#page-content' }: SkipLinkProps): VNode {
  return (
    <a href={href} class={className}>
      {children}
    </a>
  )
}

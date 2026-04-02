import type { ComponentChildren, VNode } from 'preact'
import { Page as P } from '@kurikulum/core'
import type { CompletionStrategy } from '@kurikulum/core'

export interface PageProps {
  id: string
  completion?: CompletionStrategy
  completionTimer?: number
  active?: boolean
  children: ComponentChildren
}

export function Page({ id, completion = 'mount', completionTimer, active, children }: PageProps): VNode {
  return (
    <P.Root
      id={id}
      completion={completion}
      completionTimer={completionTimer}
      active={active}
      class="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 outline-none"
    >
      {children}
      <P.ScrollSentinel />
    </P.Root>
  )
}

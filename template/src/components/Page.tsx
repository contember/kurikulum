import { Page as P } from '@kurikulum/core'
import type { CompletionStrategy, CourseRuntime } from '@kurikulum/core'
import type { ComponentChildren, VNode } from 'preact'

export interface PageProps {
  id: string
  completion?: CompletionStrategy
  completionTimer?: number
  active?: boolean
  when?: (runtime: CourseRuntime) => boolean
  children?: ComponentChildren
}

export function Page({ id, completion = 'mount', completionTimer, active, when, children }: PageProps): VNode {
  return (
    <P.Root
      id={id}
      completion={completion}
      completionTimer={completionTimer}
      active={active}
      when={when}
      class="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 outline-none"
    >
      {children}
      <P.ScrollSentinel />
    </P.Root>
  )
}

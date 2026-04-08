import { Course as C } from 'kurikulum'
import type { ComponentChildren, VNode } from 'preact'

export interface CourseProps {
  children?: ComponentChildren
}

export function Course({ children }: CourseProps): VNode | null {
  return (
    <C.Root class="flex-1 overflow-y-auto">
      <C.SkipLink class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-bg focus:text-primary focus:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        Přeskočit na obsah
      </C.SkipLink>
      {children}
    </C.Root>
  )
}

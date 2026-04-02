import type { VNode } from 'preact'
import { Navigation as N } from '@kurikulum/core'

export function Navigation(): VNode {
  return (
    <N.Root class="flex items-center justify-between gap-4 p-4 border-t border-border bg-bg-surface">
      <N.Prev class="px-4 py-2 bg-bg-surface text-text border border-border rounded-default hover:bg-bg-muted disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        Předchozí
      </N.Prev>
      <N.Progress class="text-text-secondary" />
      <N.Next class="px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        Další
      </N.Next>
    </N.Root>
  )
}

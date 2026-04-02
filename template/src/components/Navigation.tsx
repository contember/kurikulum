import type { VNode } from 'preact'
import { h } from 'preact'
import { useNavigation } from '@kurikulum/core'

export function Navigation(): VNode {
  const { canGoNext, canGoPrev, next, prev, pageIndex, totalPages } = useNavigation()

  return h('nav', { role: 'navigation', 'aria-label': 'Navigace kurzu', class: 'flex items-center justify-between gap-4 p-4 border-t border-border bg-bg-surface' },
    h('button', {
      disabled: !canGoPrev,
      'aria-disabled': !canGoPrev,
      onClick: prev,
      class: 'px-4 py-2 bg-bg-surface text-text border border-border rounded-default hover:bg-bg-muted disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    }, 'Předchozí'),
    h('span', { 'aria-current': 'page', class: 'text-text-secondary' }, `${pageIndex + 1} / ${totalPages}`),
    h('button', {
      disabled: !canGoNext,
      'aria-disabled': !canGoNext,
      onClick: next,
      class: 'px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    }, 'Další'),
  )
}

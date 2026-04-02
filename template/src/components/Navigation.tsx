import type { VNode } from 'preact'
import { h } from 'preact'
import { useNavigation } from '@kurikulum/core'

export function Navigation(): VNode {
  const { canGoNext, canGoPrev, next, prev, pageIndex, totalPages } = useNavigation()

  return h('nav', { role: 'navigation', 'aria-label': 'Navigace kurzu' },
    h('button', {
      disabled: !canGoPrev,
      'aria-disabled': !canGoPrev,
      onClick: prev,
      class: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded',
    }, 'Předchozí'),
    h('span', { 'aria-current': 'page' }, `${pageIndex + 1} / ${totalPages}`),
    h('button', {
      disabled: !canGoNext,
      'aria-disabled': !canGoNext,
      onClick: next,
      class: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded',
    }, 'Další'),
  )
}

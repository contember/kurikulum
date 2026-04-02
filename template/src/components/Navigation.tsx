import type { VNode } from 'preact'
import { h } from 'preact'
import { useNavigation } from '@kurikulum/core'

export function Navigation(): VNode {
  const { canGoNext, canGoPrev, next, prev, pageIndex, totalPages } = useNavigation()

  return h('nav', { role: 'navigation', 'aria-label': 'Navigace kurzu' },
    h('button', { disabled: !canGoPrev, onClick: prev }, 'Předchozí'),
    h('span', null, `${pageIndex + 1} / ${totalPages}`),
    h('button', { disabled: !canGoNext, onClick: next }, 'Další'),
  )
}

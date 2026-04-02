import type { ComponentChildren, VNode } from 'preact'
import { h, toChildArray } from 'preact'
import { useNavigation } from '@kurikulum/core'

export interface CourseProps {
  children: ComponentChildren
}

export function Course({ children }: CourseProps): VNode | null {
  const { currentPage } = useNavigation()

  const pages = toChildArray(children) as VNode[]
  const activePage = pages.find((child) => child?.props?.id === currentPage)

  if (!activePage) {
    return null
  }

  // Key by page id to force unmount/remount on navigation
  return h('div', null,
    h('a', {
      href: '#page-content',
      class: 'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-700 focus:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
    }, 'Přeskočit na obsah'),
    h('div', { key: activePage.props.id }, activePage),
  )
}

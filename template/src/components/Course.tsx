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
  return h('div', { key: activePage.props.id }, activePage)
}

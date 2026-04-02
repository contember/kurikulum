import type { ComponentChildren, VNode } from 'preact'
import { toChildArray } from 'preact'
import { useNavigation } from '../../hooks/index.ts'

export interface CourseRootProps {
  class?: string
  children: ComponentChildren
}

export function Root({ children, class: className }: CourseRootProps): VNode {
  const { currentPage } = useNavigation()

  const allChildren = toChildArray(children) as VNode[]
  const nonPages: VNode[] = []
  let activePage: VNode | null = null

  for (const child of allChildren) {
    const id = (child as VNode<{ id?: string }>)?.props?.id
    if (id != null) {
      if (id === currentPage) {
        activePage = child
      }
    } else {
      nonPages.push(child)
    }
  }

  if (!activePage) {
    return null
  }

  return (
    <div class={className}>
      {nonPages}
      <div key={(activePage as VNode<{ id?: string }>).props.id}>{activePage}</div>
    </div>
  )
}

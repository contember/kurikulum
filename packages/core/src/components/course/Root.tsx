import type { ComponentChildren, VNode } from 'preact'
import { toChildArray, cloneElement } from 'preact'
import { useNavigation } from '../../hooks/index.ts'

export interface CourseRootProps {
  class?: string
  children: ComponentChildren
}

export function Root({ children, class: className }: CourseRootProps): VNode {
  const { currentPage } = useNavigation()

  const allChildren = toChildArray(children) as VNode[]
  const nonPages: VNode[] = []
  const pages: VNode[] = []

  for (const child of allChildren) {
    const id = (child as VNode<{ id?: string }>)?.props?.id
    if (id != null) {
      pages.push(child)
    } else {
      nonPages.push(child)
    }
  }

  return (
    <div class={className}>
      {nonPages}
      {pages.map((page) => {
        const id = (page as VNode<{ id: string }>).props.id
        const active = id === currentPage
        return (
          <div key={id} style={active ? undefined : { display: 'none' }}>
            {cloneElement(page, { active })}
          </div>
        )
      })}
    </div>
  )
}

import type { ComponentChildren, VNode } from 'preact'
import { cloneElement, toChildArray } from 'preact'
import { useContext, useEffect } from 'preact/hooks'
import { resolveCompletionStrategy } from '../../completion.ts'
import type { CompletionStrategy } from '../../completion.ts'
import { CourseContext } from '../../context.tsx'
import { useNavigation } from '../../hooks/index.ts'
import type { CourseRuntime } from '../../types.ts'

export interface CourseRootProps {
  class?: string
  children?: ComponentChildren
}

export function Root({ children, class: className }: CourseRootProps): VNode {
  const ctx = useContext(CourseContext)!
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

  // Register when conditions from page props
  const conditions = ctx.pageConditions
  for (const key of Object.keys(conditions)) {
    delete conditions[key]
  }
  for (const page of pages) {
    const props = page.props as unknown as { id: string; when?: (runtime: CourseRuntime) => boolean }
    if (props.when) {
      conditions[props.id] = props.when
    }
  }

  const visiblePages = ctx.getVisiblePages()

  // Pre-populate completions for visible mount-strategy pages so that Navigation
  // renders with canGoNext=true on the first paint. Safe to call during render:
  // subscribers are registered in useEffect, so on the initial render notify()
  // has no listeners. The isComplete guard prevents notify feedback on re-renders.
  const visibleSet = new Set(visiblePages)
  for (const page of pages) {
    const props = page.props as unknown as { id: string; completion?: CompletionStrategy }
    if (!visibleSet.has(props.id)) continue
    const strategy = resolveCompletionStrategy(props.completion, ctx.defaultCompletion)
    if (strategy === 'mount' && !ctx.runtime.isComplete(props.id)) {
      ctx.runtime.markComplete(props.id)
    }
  }

  // If current page is not visible, navigate to nearest visible page
  useEffect(() => {
    if (visiblePages.length > 0 && !visiblePages.includes(currentPage)) {
      const allPageIds = ctx.runtime.state.pages
      const currentIdx = allPageIds.indexOf(currentPage)
      // Find nearest visible page (prefer forward, then backward)
      let nearest = visiblePages[0]
      for (const vp of visiblePages) {
        const vpIdx = allPageIds.indexOf(vp)
        if (vpIdx >= currentIdx) {
          nearest = vp
          break
        }
        nearest = vp
      }
      ctx.runtime.navigateTo(nearest)
    }
  }, [currentPage, visiblePages.join('|')])

  return (
    <div class={className}>
      {nonPages}
      {pages.map((page) => {
        const props = page.props as unknown as { id: string; when?: (runtime: CourseRuntime) => boolean }
        const id = props.id
        // Skip pages whose when condition returns false
        if (props.when && !props.when(ctx.runtime)) return null
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

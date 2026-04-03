import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { NotesContext } from './context.ts'

export interface NotesIndicatorProps {
  class?: string
  pageId?: string
  children?: ComponentChildren | ((hasNotes: boolean, count: number) => ComponentChildren)
}

export function Indicator({ class: className, pageId, children }: NotesIndicatorProps): VNode | null {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('Notes.Indicator must be used within Notes.Root')

  const resolvedPageId = pageId ?? ctx.currentPageId
  const pageNotes = ctx.getNotesForPage(resolvedPageId)
  const hasNotes = pageNotes.length > 0
  const count = pageNotes.length

  if (typeof children === 'function') {
    return <span class={className}>{children(hasNotes, count)}</span>
  }

  if (!hasNotes) return null

  return (
    <span class={className} aria-label={`${count} note${count === 1 ? '' : 's'}`}>
      {children ?? count}
    </span>
  )
}

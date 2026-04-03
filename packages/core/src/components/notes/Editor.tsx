import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { NotesContext } from './context.ts'

export interface NotesEditorProps {
  class?: string
  pageId?: string
  children?: ComponentChildren | ((ctx: {
    notes: { text: string; createdAt: number }[]
    addNote: (text: string) => void
    removeNote: (index: number) => void
    updateNote: (index: number, text: string) => void
  }) => ComponentChildren)
}

export function Editor({ class: className, pageId, children }: NotesEditorProps): VNode {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('Notes.Editor must be used within Notes.Root')

  const resolvedPageId = pageId ?? ctx.currentPageId
  const pageNotes = ctx.getNotesForPage(resolvedPageId)

  if (typeof children === 'function') {
    return (
      <div class={className}>
        {children({
          notes: pageNotes.map((n) => ({ text: n.text, createdAt: n.createdAt })),
          addNote: (text: string) => ctx.addNote(resolvedPageId, text),
          removeNote: (index: number) => ctx.removeNote(resolvedPageId, index),
          updateNote: (index: number, text: string) => ctx.updateNote(resolvedPageId, index, text),
        })}
      </div>
    )
  }

  return (
    <div class={className} role="region" aria-label="Page notes">
      {pageNotes.map((note, i) => (
        <div key={`${note.createdAt}-${i}`}>
          <span>{note.text}</span>
        </div>
      ))}
      {children}
    </div>
  )
}

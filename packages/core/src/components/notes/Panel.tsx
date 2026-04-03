import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect, useRef } from 'preact/hooks'
import { NotesContext } from './context.ts'

export interface NotesPanelProps {
  class?: string
  children?: ComponentChildren
}

export function Panel({ class: className, children }: NotesPanelProps): VNode | null {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('Notes.Panel must be used within Notes.Root')

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ctx.isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        ctx.close()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [ctx.isOpen, ctx.close])

  if (!ctx.isOpen) return null

  return (
    <div ref={panelRef} class={className} role="dialog" aria-label="Notes" aria-modal="false">
      {children ?? (
        <ul>
          {ctx.notes.map((note, i) => (
            <li key={`${note.pageId}-${note.createdAt}-${i}`}>
              <span data-page={note.pageId}>{note.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

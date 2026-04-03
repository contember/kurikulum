import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect } from 'preact/hooks'
import { NotesContext } from './context.ts'

export interface NotesPanelProps {
  class?: string
  children?: ComponentChildren
}

export function Panel({ class: className, children }: NotesPanelProps): VNode | null {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('Notes.Panel must be used within Notes.Root')

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
    <div class={className} role="dialog" aria-label="Notes" aria-modal="false">
      {children}
    </div>
  )
}

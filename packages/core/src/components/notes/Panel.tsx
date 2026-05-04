import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect } from 'preact/hooks'
import { useLocale } from '../../i18n/index.ts'
import { NotesContext } from './context.ts'

export interface NotesPanelProps {
  class?: string
  children?: ComponentChildren
  'aria-label'?: string
}

export function Panel({ class: className, children, 'aria-label': ariaLabel }: NotesPanelProps): VNode | null {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('Notes.Panel must be used within Notes.Root')
  const { t } = useLocale()

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
    <div class={className} role="dialog" aria-label={ariaLabel ?? t('notes.panel')} aria-modal="false">
      {children}
    </div>
  )
}

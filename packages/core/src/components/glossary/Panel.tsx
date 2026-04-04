import type { ComponentChildren, VNode } from 'preact'
import { useContext, useEffect, useRef } from 'preact/hooks'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { GlossaryContext } from './context.ts'

export interface GlossaryPanelProps {
  class?: string
  children?: ComponentChildren
}

export function Panel({ class: className, children }: GlossaryPanelProps): VNode | null {
  const ctx = useContext(GlossaryContext)
  if (!ctx) throw new Error('Glossary.Panel must be used within Glossary.Root')

  const panelRef = useRef<HTMLDivElement>(null)

  useFocusTrap(panelRef, ctx.isOpen)

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

  useEffect(() => {
    if (ctx.isOpen && panelRef.current) {
      const input = panelRef.current.getElementsByTagName('input')[0] as HTMLElement | undefined
      input?.focus()
    }
  }, [ctx.isOpen])

  if (!ctx.isOpen) return null

  return (
    <div ref={panelRef} class={className} role="dialog" aria-label="Glossary" aria-modal="true">
      {children ?? (
        <>
          <dl>
            {ctx.filtered.map((entry) => (
              <div key={entry.term}>
                <dt>{entry.term}</dt>
                <dd>{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  )
}

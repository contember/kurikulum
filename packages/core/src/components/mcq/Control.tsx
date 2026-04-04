import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { MCQContext, MCQItemContext } from './context.ts'

export interface MCQControlProps {
  class?: string
}

export function Control({ class: className }: MCQControlProps): VNode {
  const ctx = useContext(MCQContext)
  const itemCtx = useContext(MCQItemContext)
  if (!ctx) throw new Error('MCQ.Control must be used within MCQ.Root')
  if (!itemCtx) throw new Error('MCQ.Control must be used within MCQ.Item')

  // Roving tabindex: only the selected radio (or first if none) is tabbable
  const isRovingTarget = ctx.selected === null ? itemCtx.index === 0 : ctx.selected === itemCtx.index

  return (
    <input
      type="radio"
      name={ctx.id}
      checked={itemCtx.selected}
      onChange={() => ctx.select(itemCtx.index)}
      disabled={itemCtx.disabled}
      aria-disabled={itemCtx.disabled}
      tabIndex={isRovingTarget ? 0 : -1}
      class={className}
    />
  )
}

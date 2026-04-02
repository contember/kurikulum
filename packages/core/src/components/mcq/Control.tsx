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

  return (
    <input
      type="radio"
      name={ctx.id}
      checked={itemCtx.selected}
      onChange={() => ctx.select(itemCtx.index)}
      disabled={itemCtx.disabled}
      aria-disabled={itemCtx.disabled}
      class={className}
    />
  )
}

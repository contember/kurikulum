import type { ComponentChildren, VNode } from 'preact'
import { useState, useContext } from 'preact/hooks'
import { MCQContext, MCQItemContext } from './context.ts'

export interface MCQItemProps {
  correct?: boolean
  children?: ComponentChildren
  class?: string
}

export function Item({ correct = false, children, class: className }: MCQItemProps): VNode {
  const ctx = useContext(MCQContext)
  if (!ctx) throw new Error('MCQ.Item must be used within MCQ.Root')

  const [index] = useState(() => ctx.registerItem(correct))
  const selected = ctx.selected === index
  const disabled = ctx.submitted

  return (
    <MCQItemContext.Provider value={{ index, correct, selected, disabled }}>
      <label
        class={className}
        data-selected={selected || undefined}
        data-correct={ctx.submitted ? String(correct) : undefined}
        data-disabled={disabled || undefined}
      >
        {children}
      </label>
    </MCQItemContext.Provider>
  )
}

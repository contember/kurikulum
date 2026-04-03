import type { ComponentChildren, VNode } from 'preact'
import { useState, useContext } from 'preact/hooks'
import { MultiSelectContext, MultiSelectItemContext } from './context.ts'

export interface MultiSelectItemProps {
  correct?: boolean
  children?: ComponentChildren
  class?: string
}

export function Item({ correct = false, children, class: className }: MultiSelectItemProps): VNode {
  const ctx = useContext(MultiSelectContext)
  if (!ctx) throw new Error('MultiSelect.Item must be used within MultiSelect.Root')

  const [index] = useState(() => ctx.registerItem(correct))
  const selected = ctx.selected.has(index)
  const disabled = ctx.submitted

  return (
    <MultiSelectItemContext.Provider value={{ index, correct, selected, disabled }}>
      <label
        class={className}
        data-selected={selected || undefined}
        data-correct={ctx.submitted ? String(correct) : undefined}
        data-disabled={disabled || undefined}
      >
        {children}
      </label>
    </MultiSelectItemContext.Provider>
  )
}
